var gulp = require('gulp');
var coffee = require('gulp-coffee');


compileCoffee = function(coffeeStream , compiler) {
  return coffeeStream.pipe(compiler({bare: true})).pipe(gulp.dest('./'));
};

gulp.task("coffee", function(){
  return compileCoffee(gulp.src('src/*.coffee'), coffee);
});

gulp.task("default", function() {
  return gulp.start('coffee');
});
