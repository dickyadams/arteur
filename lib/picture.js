var AWS = require('aws-sdk');
var Redis = require('./redis.js')(process.env.REDIS_URL);

exports.register = function (server, options, next) {

    server.route({
        method: 'POST',
        path: '/sign_s3',
        config: {
            description: 'upload picture to AWS',
            handler: function (request, reply) {

                //get the id for the review
                Redis.get('idReview', function (err, idReview) {

                    if (err) {
                        return next(err);
                    }

                    var paramsRequest = JSON.parse(request.payload);
                    var fileName = 'review:' + idReview;
                    AWS.config.update({accessKeyId: process.env.AWS_ACCESS_KEY, secretAccessKey: process.env.AWS_SECRET_KEY});
                    var s3 = new AWS.S3();
                    var s3_params = {
                        Bucket: process.env.S3_BUCKET,
                        Key: fileName,
                        Expires: 60,
                        ContentType: paramsRequest.file_type,
                        ACL: 'public-read'
                    };

                    s3.getSignedUrl('putObject', s3_params, function(err, data){

                        if (err) {
                            return next(err);
                        }

                        else{

                            var return_data = {
                                signed_request: data,
                                url: 'https://' + process.env.S3_BUCKET + '.s3.amazonaws.com/' + fileName
                            };

                            return reply(return_data);
                        }
                    });
                });
            }
        }
    });

    return next();
};

exports.register.attributes = {
    name: 'Picture'
};