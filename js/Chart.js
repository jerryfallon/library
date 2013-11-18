function Chart() {
}

Chart.prototype.init = function() {
	// this.drawData();
};

Chart.prototype.drawData = function() {
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