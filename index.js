import fs from 'fs'
import path from 'path'
import lineByLine from 'n-readlines';


const args = []
for (let j = 0; j < process.argv.length; j++) {
    if(j > 1){
      const arg = process.argv[j]
      args.push(arg)
    }
}

const type = args[0];

if(!type){
	console.log("Please enter 'web' or 'mobile' as an argument")
	process.exit()
}

var walk = function(dir, done) {
  var results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    var pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

walk('./src', function(err, results) {
  if (err) throw err;
  let replacements = {};
  results.forEach(file=>{
		const liner = new lineByLine(file);
		let line;
		while (line = liner.next()) {
		    if(line.includes("@switch")){
		    	const isType = line.includes(type);
			    const lineToSwitch = liner.next().toString('ascii');
			    let newLine = lineToSwitch;
			    if(!isType){
			    	if(lineToSwitch.trim().indexOf("//") !== 0){
			    		newLine = "// "+newLine
			    	}
			    } else{
			    	newLine = newLine.replace(/\/\//g,"");
			    }
			    if(!replacements[file]){
			    	replacements[file] = [];
			    }
			    replacements[file].push( [ lineToSwitch, newLine ] ) 
		    }
		}
  })



	Object.keys(replacements).forEach((file) =>{
		fs.readFile(file, 'utf8', function (err,data) {
			let formatted = data;
			replacements[file].forEach(pair=>{
			    formatted = formatted.replace(pair[0].trim(),pair[1].trim());
			})

			fs.writeFile(file, formatted, 'utf8', function (err) {
			    if (err) return console.log(err);
			});
		});	
	})

});