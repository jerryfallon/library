function Chart() {
	this.ratings = [];

	this.initHandlers();
}

Chart.prototype.init = function() {
	this.entriesByRating();
	// this.averageRatingByDate();
};

Chart.prototype.initHandlers = function() {
	var that = this;
	$('#chart-switch').change( function() {
		if($(this).val() === 'entriesByRating') {
			that.entriesByRating();
		} else if($(this).val() === 'averageRatingOverTime') {
			that.averageRatingByDate();
		}
	});
};

Chart.prototype.entriesByRating = function() {
	db.getCounts('movies', function(movieCounts) {
		db.getCounts('games', function(gameCounts) {
			// console.log(movieCounts);
			// console.log(gameCounts);

			// Model object
			var model = {
				title: 'Entries By Rating',
				series: [{
					title: 'Movies',
					points: movieCounts
				},
				{
					title: 'Games',
					points: gameCounts
				}]
			};

			// Get height/width
			var width = $('#container').width()-20;
			var height = width * (9/16);

			// View object
			var view = {
				width: width,
				height: height,
				xAxis: {
					formatter: 'Number'
				}
			};

			var lineChart = new MeteorCharts.Line({
				container: 'chartContainer',
				model: model,
				view: view
			});
		});
	});
};

Chart.prototype.averageRatingByDate = function(date) {
	if(!date) {
		date = new Date(2005, 1, 1);
	} else {
		if(date.getMonth() < 11) {
			date.setMonth(date.getMonth()+1);
		} else {
			date.setMonth(0);
			date.setFullYear(date.getFullYear()+1);
		}
	}
	var that = this;
	//console.log(date);
	db.averageRatingByDate(date, function(results) {
		//console.log(results[0].rating);
		that.ratings.push({x: Date.parse(date)/1000, y: results[0].rating});
		if(date < new Date()) {
			that.averageRatingByDate(date);
		} else {

			//console.log(that.ratings);

			// Model object
			var model = {
				title: 'Average Rating Over Time',
				series: [{
					title: 'Movies',
					points: that.ratings
				}]
			};

			// Get height/width
			var width = $('#container').width()-20;
			var height = width * (9/16);

			// View object
			var view = {
				width: width,
				height: height,
				xAxis: {
					formatter: 'Date'
				},
				yAxis: {
					min: 0,
					max: 10
				}
			};

			var lineChart = new MeteorCharts.Line({
				container: 'chartContainer',
				model: model,
				view: view
			});

		}
	});
};