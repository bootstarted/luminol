const midori = require('midori');
const createApp = midori.send('Hello world.');

const app = createApp();
app.listen(process.env.PORT, () => {
  console.log('Demo app listening.');
});
