const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const Dishes = require('../models/dishes');
var authenticate = require('../authenticate');

const dishRouter = express.Router();

dishRouter.use(bodyParser.json());

dishRouter.route('/')
.get((req, res, next) => {
    Dishes.find({})
    .populate('comments.author')
    .then((dishes) => { 
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(dishes);
    },
    (err) => next(err))
    .catch((err) => next(err));
})
.post(authenticate.verifyUser, (req, res, next) => {
    if (authenticate.verifyAdmin(req, res, next)) {
        Dishes.create(req.body)
        .then((dish) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(dish);
        },
        (err) => next(err))
        .catch((err) => next(err));
    }
})
.put(authenticate.verifyUser, (req, res, next) => {
    if (authenticate.verifyAdmin(req, res, next)) {
        res.statusCode = 403;
        res.end('PUT operation not supported on /dishes');
    }
})
.delete(authenticate.verifyUser, (req, res, next) => {
    if (authenticate.verifyAdmin(req, res, next)) {
        Dishes.remove({})
        .then((resp) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(resp);
        },
        (err) => next(err))
        .catch((err) => next(err));
    }
});
dishRouter.route('/:dishId')
.get((req, res, next) => {
    Dishes.findById(req.params.dishId)
    .populate('comments.author')
    .then((dish) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(dish);
    },
    (err) => next(err))
    .catch((err) => next(err));
})
.post(authenticate.verifyUser, (req, res, next) => {
    if (authenticate.verifyAdmin(req, res, next)) {
        res.statusCode = 403;
        res.end('POST operation not supported on /dishes/' + req.params.dishId);
    }
})
.put(authenticate.verifyUser, (req, res, next) => {
    if (authenticate.verifyAdmin(req, res, next)) {
        Dishes.findByIdAndUpdate(req.params.dishId, {
            $set: req.body
        }, {
            new: true
        })
        .then((dish) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(dish);
        },
        (err) => next(err))
        .catch((err) => next(err));
    }
})
.delete(authenticate.verifyUser, (req, res, next) => {
    if (authenticate.verifyAdmin(req, res, next)) {
        Dishes.findByIdAndRemove(req.params.dishId)
        .then((resp) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(resp);
        },
        (err) => next(err))
        .catch((err) => next(err));
    }
});
dishRouter.route('/:dishId/comments')
.get((req, res, next) => {
    dishId = req.params.dishId;
    Dishes.findById(dishId)
    .populate('comments.author')    
    .then((dish) => {
        if (dish != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(dish.comments);
        } else {
            err = new Error('Dish ' + dishId + ' not found');
            err.status = 404;
            return next(err);
        }
    },
    (err) => next(err))
    .catch((err) => next(err));
})
.post(authenticate.verifyUser, (req, res, next) => {
    Dishes.findById(req.params.dishId)
    .then((dish) => {
        if (dish != null) {
            req.body.author = req.user._id;
            dish.comments.push(req.body);
            dish.save()
            .then((dish) => {
                Dishes.findById(dish._id)
                .populate('comments.author')
                .then((dish) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(dish);
                })            
            }, (err) => next(err));
        }
        else {
            err = new Error('Dish ' + req.params.dishId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})  
.put(authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /dishes/' + req.params.dishId + '/comments');
})
.delete(authenticate.verifyUser, (req, res, next) => {
    if (authenticate.verifyAdmin(req, res, next)) {
        dishId = req.params.dishId;
        Dishes.findById(dishId)
        .then((dish) => {
            if (dish != null) {
                for (var i = (dish.comments.length - 1); i >= 0; i--) {
                    dish.comments.id(dish.comments[i]._id).remove();
                }
                dish.save()
                .then((dish) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(dish);
                },
                (err) => next(err))
                .catch((err) => next(err));
            } else {
                err = new Error('Dish ' + dishId + ' not found');
                err.status = 404;
                return next(err);
            }
        },
        (err) => next(err))
        .catch((err) => next(err));
    }
});

dishRouter.route('/:dishId/comments/:commentId')
.get((req, res, next) => {
    dishId = req.params.dishId;
    commentId = req.params.commentId;
    Dishes.findById(dishId)
    .populate('comments.author')
    .then((dish) => {
        if (dish != null && dish.comments.id(commentId) != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(dish.comments.id(commentId));
        } else if (dish == null) {
            err = new Error('Dish ' + dishId + ' not found');
            err.status = 404;
            return next(err);
        } else {
            err = new Error('Comment ' + commentId + ' not found');
            err.status = 404;
            return next(err);
        }
    },
    (err) => next(err))
    .catch((err) => next(err));
})
.post(authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('POST operation not supported on /dishes/' + req.params.dishId + '/comments/' + req.params.commentId);
})
.put(authenticate.verifyUser, (req, res, next) => {
    dishId = req.params.dishId;
    commentId = req.params.comment  
    Dishes.findById(dishId)
    .then((dish) => {
        authorId = req.user._id;
        commentAuthor = dish.comments.id(commentId).author._id;
        if (dish != null && dish.comments.id(commentId) != null && authorId.equals(commentAuthor)) {
            rating = req.body.rating;
            comment = req.body.comment;
        
            if (rating) {
                dish.comments.id(commentId).rating = rating;
            }
            if (comment) {
                dish.comments.id(commentId).comment = comment;
            }
            dish.save()
            .then((dish) => {
                Dishes.findById(dish._id)
                .populate('comments.author')
                .then((dish) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(dish);
                })
            },
            (err) => next(err))
            .catch((err) => next(err));
        } else if (dish == null) {
            err = new Error('Dish ' + dishId + ' not found');
            err.status = 404;
            return next(err);
        } else if (dish.comments.id(commentId) == null) {
            err = new Error('Comment ' + commentId + ' not found');
            err.status = 404;
            return next(err);
        } else {
            err = new Error('You are not authorized to update this comment');
            err.status = 403;
            return next(err);
        }
    },
    (err) => next(err))
    .catch((err) => next(err));
})
.delete(authenticate.verifyUser, (req, res, next) => {
    dishId = req.params.dishId;
    commentId = req.params.commentId;
    Dishes.findById(dishId)
    .then((dish) => {
        authorId = req.user._id;
        commentAuthor = dish.comments.id(commentId).author._id;
        if (dish != null && dish.comments.id(commentId) != null && authorId.equals(commentAuthor)) {
            dish.comments.id(commentId).remove();
            dish.save()
            .then((dish) => {
                Dishes.findById(dish._id)
                .populate('comments.author')
                .then((dish) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(dish);
                })
            },
            (err) => next(err))
            .catch((err) => next(err));
        } else if (dish == null) {
            err = new Error('Dish ' + dishId + ' not found');
            err.status = 404;
            return next(err);
        } else if (dish.comments.id(commentId) == null) {
            err = new Error('Comment ' + commentId + ' not found');
            err.status = 404;
            return next(err);
        } else {
            err = new Error('You are not authorized to update this comment');
            err.status = 403;
            return next(err);
        }
    },
    (err) => next(err))
    .catch((err) => next(err));
});
module.exports = dishRouter;