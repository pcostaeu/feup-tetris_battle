/**
 * Created by paulo on 11-Jan-17.
 */

var socket;
var sound_ButtonUp;
var background_sound;
var URL = "192.168.1.25";

var app = {
    initialize: function () {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
        document.addEventListener('backbutton', this.backButton.bind(this), false);
        document.addEventListener('pause', this.pause.bind(this), false);
        document.addEventListener('resume', this.resume.bind(this), false);
    },
    onDeviceReady: function () {
        playMusic();

        sound_ButtonUp = new Media('/android_asset/www/img/sounds/SFX_ButtonUp.wav');
        sound_ButtonUp.setVolume(1.0);
    },
    backButton: function (e) {
        e.preventDefault();
        navigator.notification.confirm("Are you sure you want to exit?", function (button) {
            if (button == 1) {
                navigator.app.exitApp();
            }
        }, "Confirmation", "Yes,No");
    },
    pause: function () {
        background_sound.setVolume('0.0');
    },
    resume: function () {
        background_sound.setVolume('0.4');
    }

};

app.initialize();

$(function () {

    socket = io.connect('http://' + URL + ':3000');
    var username = window.localStorage.getItem('username');

    socket.on('connect', function () {
        socket.emit('username', {user: username});
    });

    socket.on('refreshPlayers', function (playersList) {
        $('#loggedPlayers').empty();
        var index = playersList.indexOf(username);
        playersList.splice(index, 1);
        if (playersList.length == 0) {
            $('#loggedPlayers').html('<h1>No available players :(')
        }
        else {
            for (var i = 0; i < playersList.length; i++) {
                $('#loggedPlayers').append('<li class="list-group-item">' + playersList[i] + '</li>')
            }
        }
        manageList();
    });

    socket.on('new_game', function (data) {
        navigator.notification.confirm("Start game with " + data.initial_user + "?", function (button) {
            if (button == 1) {
                socket.emit('new_game_reply', {confirmation: 'yes', user: data.user, initial_user: data.initial_user});
            } else {
                socket.emit('new_game_reply', {confirmation: 'no', user: data.user, initial_user: data.initial_user});
            }
        }, "Confirmation", "Yes,No");
    });

    socket.on('reply_to_request_game', function (data) {
        if (data.reply == 'no') {
            alert(data.user + " doesn't like you :(");
            window.location = "home.html";
        }
        else {
            window.localStorage.setItem('opponent', data.user);
            window.location = "game.html";
        }
    });

    updateLabels();
    startNewGame();
});

$('#settings').click(function (e) {
    sound_ButtonUp.play();

    $('#settings-panel').html(' <div class="row"><div class="panel"><div class="col-lg-12"><h1>Settings</h1> <div class="checkbox checkbox-slider--c"> <label> <input id="music" type="checkbox" checked><span>Background music</span> </label> </div> </div> </div> </div>')

    //window.location.assign("settings.html");
    //e.preventDefault();
});

function updateLabels() {
    $.ajax({
        type: "GET",
        contentType: "application/x-www-form-urlencoded",
        url: "http://" + URL + ":3000/API/getScore?username=" + window.localStorage.getItem('username'),
        success: function (data) {
            window.localStorage.setItem('high_score', data['high_score']);
            $('#high_score').text(data['high_score']);
        },
        error: function (result) {
            throw result;
        }
    });

    $.ajax({
        type: "GET",
        contentType: "application/x-www-form-urlencoded",
        url: "http://" + URL + ":3000/API/getPoints?username=" + window.localStorage.getItem('username'),
        success: function (data) {
            window.localStorage.setItem('exp_points', data['exp_points']);
            $('#user_level').text(data['exp_points']);
        },
        error: function (result) {
            throw result;
        }
    });

    $('#username').html('<i class="fa fa-user" aria-hidden="true"></i>' + " " + window.localStorage.getItem('username'));
}

function manageList() {
    $("ul li").click(function () {
        sound_ButtonUp.play();

        $(this).parent().children().removeClass("active");
        $(this).addClass("active");
    });
}

function startNewGame() {
    $("#newGame-submit").click(function () {
        sound_ButtonUp.play();

        var initial_user = window.localStorage.getItem('username');
        var opponent = $('.active').html();
        window.localStorage.setItem('opponent', opponent);

        if (opponent == null) {
            alert("No opponent!");
        }
        else {
            $('.form-group').empty();
            $('.form-group').append('<i class="fa fa-spinner fa-pulse fa-3x fa-fw"></i>');
            socket.emit('new_game_request', {user: opponent, initial_user: initial_user});
        }
    });
}

function playMusic() {
    //if (window.localStorage.getItem('background_sound') == true) {
    background_sound = new Media('/android_asset/www/img/sounds/sound_home.mp3', null, null, function () {
        if (status == Media.MEDIA_STOPPED) {
            background_sound.play();
        }
    });
    background_sound.play();
    background_sound.setVolume('0.4');
    // }
}

$('#music').change(function () {
    if ($(this).is(":checked")) {
        window.localStorage.setItem('background_sound', true);
    }
    else {
        window.localStorage.setItem('background_sound', false);
    }
});

$('#top').click(function () {
    navigator.notification.alert('cenas cenas', null, 'About', 'Exit');
});