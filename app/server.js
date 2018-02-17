import "express"
const app = express();

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.get('/api', function (req, res) {
    res.send('Hello World via api!');
  });

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
