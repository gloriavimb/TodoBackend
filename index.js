const express = require('express')
const crypto = require('crypto');
const bcrypt = require("bcrypt");
const { response } = require('express');
const cors = require('cors');
const app = express();
const { sequelize } = require('./models')


app.use(express.json())
app.use(cors())

const port = 3001
const sessions = []


app.use((req, res, next) => {
  if (req.path === '/login' || req.path === '/register') {
    next();
  }
  else {
    if (req.headers.token) {

      //find user using session token
      let session = sessions.find(session => session.token === req.headers.token);
      if (!session) {
        console.log('session not found');
        res.status(401).json({ status: 'Unauthorized' })
        return;
      }

      //compare session expiry with current time
      let now = new Date();
      let expiresAt = new Date(session.expiresAt);
      if (now >= expiresAt) {
        res.status(401).send('Session expired')
        return;
      }

      req.usersession = session;
      next();
    }
    else {
      console.log('no token');
      res.status(401).json({ status: 'Unauthorized' });
    }
  }

})

// loginis teeme uue sessioni mis seob tokeni ja useri.
// salvestame sessioni
app.post('/login', async (req, res) => {

  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ status: 'Username or password is incorrect' });
    return;
  }

  if (typeof (username) !== "string" || typeof (password) !== "string") {
    res.status(400).json({ status: 'Username or password is incorrect' });
    return;
  }

  // find user from database
  const user = await sequelize.models.users.findOne({ where: { username: username } });

  // check if user exists
  if (user === null) {
    res.status(400).json({ status: 'Username or password is incorrect' });
    return;
  }

  // check if password is correct
  let passwordHash = user.password;
  const validPassword = await bcrypt.compare(password, passwordHash);
  if (!validPassword) {
    res.status(400).json({ status: 'Username or password is incorrect' });
    return;
  }

  // create session
  crypto.randomBytes(64, (err, buffer) => {
    var token = buffer.toString('hex');

    let session = {
      token: token,
      user: user,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 2).toISOString()
    };

    sessions.push(session);

    res.status(200).json({ status: 'OK', session: session });
  });

})


// crud api endpointid users
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (await sequelize.models.users.findOne({ where: { username: username } }) !== null) {
    res.status(409).json({ status: 'Username already exists' });
    return;
  }

  const salt = await bcrypt.genSaltSync(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const newUser = {
    username: req.body.username,
    password: hashedPassword
  }

  const user = await sequelize.models.users.create(newUser);

  res.send(user);
})

app.put('/api/user', async (req, res) => {
  if (await sequelize.models.users.findOne({ where: { username: req.body.username } }) === null) {
    res.status(404).send('User not found');
    return;
  }
  await sequelize.models.users.update({ password: req.params.password }, { where: { username: req.usersession.user.username } });
  const updatedUser = await sequelize.models.users.findOne({ where: { username: req.usersession.user.username } })

  res.status(200).json({ status: 'User updated', user: updatedUser });
})

app.delete('/api/user', async (req, res) => {
  await sequelize.models.users.destroy({ where: { username: req.usersession.user.username } });

  res.status(200).json({ status: 'User deleted' });
})

// crud api endpointid tasks
app.get('/api/tasks', async (req, res) => {
  console.log(req.usersession.user.id);
  const tasks = await sequelize.models.tasks.findAll({ where: { userId: req.usersession.user.id } });

  res.status(200).json({ status: 'OK', tasks: tasks });
})

app.post('/api/tasks', async (req, res) => {
  console.log(req.body);
  const newTask = {
    task: req.body.task,
    userId: req.usersession.user.id
  }

  if (!typeof (req.body.task) === "string") {
    res.status(400).send('Task must be a string');
    return;
  }

  const task = await sequelize.models.tasks.create(newTask);

  res.status(200).json({ status: 'OK', task: task });
})

app.put('/api/tasks', async (req, res) => {
  console.log(req.body);
  if (typeof (req.body.task) !== "string" || typeof (req.body.completed) !== "boolean" || typeof (req.body.uuid) !== "string") {
    res.status(400).send('Invalid data');
    return;
  }

  if (await sequelize.models.tasks.findOne({ where: { uuid: req.body.uuid } }) === null) {
    res.status(404).send('Task not found');
    return;
  }

  if (req.usersession.id !== sequelize.models.tasks.findOne({ where: { uuid: req.body.uuid } }).userId) {
    res.status(404).send('Task nots found');
    return;
  }


  updatedTaskData = {
    task: req.body.task,
    completed: req.body.completed
  }

  await sequelize.models.tasks.update(updatedTaskData, { where: { uuid: req.body.uuid } });
  const updatedTask = await sequelize.models.tasks.findOne({ where: { uuid: req.body.uuid } });

  res.status(200).json({ status: 'Task updated', task: updatedTask });
})

app.delete('/api/tasks', async (req, res) => {
  console.log(req.body);
  if (typeof (req.body.uuid) !== "string") {
    res.status(400).send('Invalid data');
    return;
  }

  if (req.usersession.id !== sequelize.models.tasks.findOne({ where: { id: req.body.uuid } }).userId) {
    res.status(404).send('Task not found');
    return;
  }

  await sequelize.models.tasks.destroy({ where: { uuid: req.body.uuid } });

  res.status(200).json({ status: 'Task deleted' });
})

app.listen(port, async () => {
  console.log(`Api listening on http://localhost:${port}`)
  await sequelize.authenticate();
  console.log('Database connection established');
})

