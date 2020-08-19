var csv = require('csv');

var generator = csv.generate({seed: 1, columns: 2, length: 20});
var parser = csv.parse();
var transformer = csv.transform(data => data);
var stringifier = csv.stringify();

generator.on('readable', function(){
  while(data = generator.read()){
    parser.write(data);
  }
});

parser.on('readable', function(){
  while(data = parser.read()){
    transformer.write(data);
  }
});

transformer.on('readable', function(){
  while(data = transformer.read()){
    stringifier.write(data.map(value => value.toUpperCase()));
  }
});

stringifier.on('readable', function(){
  while(data = stringifier.read()){
    process.stdout.write(data);
  }
});