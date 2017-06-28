var Genre = require('../models/genre');
var Book = require('../models/book');
var async = require('async');
var debut = require('debug')('dev');

// Display list of all Genre
exports.genre_list = function(req, res, next) {
    Genre.find()
    	.exec(function(err, list_genres){
    		if (err){ return next(err);}
    		//Succeeded
    		res.render('genre_list', {title: 'Genre List', genre_list: list_genres});
    	});
};

// Display detail page for a specific Genre
exports.genre_detail = function(req, res, next) {
	async.parallel({
		genre: function(callback){
			Genre.findById(req.params.id)
				.exec(callback);
		},

		genre_books: function(callback){
			Book.find({'genre': req.params.id })
				.exec(callback);
		},
	}, function(err, results){
		if (err) { return next(err);}
		//Successful
		res.render('genre_detail', {title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books});
	});
};

// Display Genre create form on GET
exports.genre_create_get = function(req, res) {
    res.render('genre_form',{title: 'Create Genre'});
};

// Handle Genre create on POST
exports.genre_create_post = function(req, res) {
    req.checkBody('name', 'Genre name required').notEmpty();
    req.sanitize('name').escape();
    req.sanitize('name').trim();
    var errors = req.validationErrors();
    var genre = new Genre(
    	{name: req.body.name}
    );
    if (errors){
    	res.render('genre_form', {title: 'Create Genre', genre: genre, errors: errors});
    	return;
    }
    else{
    	Genre.findOne({ 'name': req.body.name })
    		.exec(function(err, found_genre){
    			debug('found_genre: ' + found_genre);
    			if(err) {return next(err);}

    			if(found_genre){
    				res.redirect(found_genre.url);
    			}
    			else{
    				genre.save(function(err){
    					if(err) {return next(err);}
    					res.redirect(genre.url);
    				});
    			}
    		});
    }
};

// Display Genre delete form on GET
exports.genre_delete_get = function(req, res) {
    req.sanitize('id').escape();
    req.sanitize('id').trim();

    async.parallel({
        genre: function(callback){
            Genre.findById(req.params.id)
                .exec(callback);
        },
        books: function(callback){
            Book.find()
                .populate('author')
                .exec(callback);
        },
    }, function(err, results){
        if(err){return next(err);}
        var matchList = [];
        for(var i = 0; i < results.books.length; i ++){
            for(var j = 0; j < results.books[i].genre.length; j++){
                if(results.books[i].genre[j].toString()===results.genre._id.toString()){
                    matchList.push(results.books[i]);
                    continue;
                }
            }
        }
        res.render('genre_delete', {title: 'Delete Genre', genre: results.genre, genre_books: matchList});
    });
};

// Handle Genre delete on POST
exports.genre_delete_post = function(req, res, next) {
    req.checkBody('genreid', 'genreid required').notEmpty();

    async.parallel({
        genre: function(callback){
            Genre.findById(req.body.genreid)
                .exec(callback);
        },
        books: function(callback){
            Book.find()
                .populate('author')
                .exec(callback);
        },
    }, function(err, results){
        if(err){return next(err);}

        var matchList = [];
        for(var i = 0; i < results.books.length; i ++){
            for(var j = 0; j < results.books[i].genre.length; j++){
                if(results.books[i].genre[j].toString()===results.genre._id.toString()){
                    matchList.push(results.books[i]);
                    continue;
                }
            }
        }
        if(matchList.length > 0){
            res.render('genre_delete', {title: 'Delete Genre', genre: results.genre, genre_books: matchList});
        }else{
            Genre.findByIdAndRemove(req.body.genreid, function(err){
                if (err){return next(err);}
                res.redirect('/catalog/genres');
            });
        }
    });
};
