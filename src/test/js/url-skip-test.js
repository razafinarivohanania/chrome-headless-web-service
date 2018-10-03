const UrlSkip = require('../../main/js/url/url-skip');


function testImage() {
    const req = {
        body: {
            skip: {
                resources: [
                    'image'
                ]
            }
        }
    };

    if (new UrlSkip('http://localhost/favicon.ico', req).isToSkip())
        console.log('Image OK');
    else
        throw new Error('To skip expected');
}

testImage();

function testVideo() {
    const req = {
        body: {
            skip: {
                resources: [
                    'video'
                ]
            }
        }
    };

    if (new UrlSkip('http://localhost/video.mp4', req).isToSkip())
        console.log('Video OK');
    else
        throw new Error('To skip expected');
}

testVideo();

function testAudio(){
    const req = {
        body: {
            skip: {
                resources: [
                    'audio'
                ]
            }
        }
    };

    if (new UrlSkip('http://localhost/music.mp3', req).isToSkip())
        console.log('Audio OK');
    else
        throw new Error('To skip expected');
}

testAudio();

function testEquals(){
    const req = {
        body: {
            skip: {
                url: {
                    equals : [
                        'https://www.google.com',
                        'http://localhost'
                    ]
                }
            }
        }
    };

    if (new UrlSkip('http://localhost', req).isToSkip())
        console.log('Equals OK');
    else
        throw new Error('To skip expected');
}

testEquals();

function testContains(){
    const req = {
        body: {
            skip: {
                url: {
                    contains : [
                        'www.google.com',
                        'localhost'
                    ]
                }
            }
        }
    };

    if (new UrlSkip('http://localhost', req).isToSkip())
        console.log('Contains OK');
    else
        throw new Error('To skip expected');
}

testContains();

function testPatterns(){
    const req = {
        body: {
            skip: {
                url: {
                    patterns : [
                        '\\d',
                        '[a-z]'
                    ]
                }
            }
        }
    };

    if (new UrlSkip('http://localhost/1', req).isToSkip())
        console.log('Patterns OK');
    else
        throw new Error('To skip expected');
}

testPatterns();

function testFunction(){
    const req = {
        body: {
            skip: {
                url: {
                    function : 'function(url){return url.includes("a");}'
                }
            }
        }
    };

    if (new UrlSkip('http://localhost/1', req).isToSkip())
        console.log('Function OK');
    else
        throw new Error('To skip expected');
}

testFunction();

function testCss(){
    const req = {
        body: {
            skip:{
                resources : [
                    "css"
                ]
            }
        }
    }

    if (new UrlSkip('http://www.pourmonbureau.com/media/css/a66ce8b44185dbe1051c4886499b0293.css', req).isToSkip())
        console.log('CSS OK');
    else
        throw new Error('To skip expected');
}

testCss();