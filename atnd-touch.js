var jQT = new $.jQTouch({
  icon: 'atnd-touch-icon.png',
  startupScreen: 'atnd-touch-startup.png',
  statusBar: 'black-translucent',
  preloadImages: [
    'themes/jqt/img/back_button_clicked.png',
    'themes/jqt/img/button_clicked.png'
  ]
});

function getEvents(option, callback) {
  var defaultOption = {
    start: 1,
    count: 11,
    format: 'jsonp',
  };

  var query = defaultOption;

  $.each(option, function(key, val) {
    query[key] = val;
  });

  $.getJSON(
    'http://api.atnd.org/events/?callback=?',
    query,
    callback
  );
}

function getUsers(option, callback) {
  return true; // dummy 
}

var selfEvents, searchEvents, bookmarkEvents;

$(function(){
  window.scrollTo(0, 0);

  $('#bookmark-events+.counter').text(0);

  twttr.anywhere(function(T) {
    var currentUser, screenName, profileImage, profileImage, profileImageTag;

    var authorized = function(user) {
      currentUser = user;
      screenName = currentUser.data('screen_name');
      profileImage = currentUser.data('profile_image_url');
      profileImageTag = '<img width="16" height="16" src="' + profileImage + '"/>';
      $('#settings').removeClass('current');
      $('#home').addClass('current');
      $('#logout').show();

      // 自身の参加イベントを取得
      getEvents({twitter_id: screenName, count: 999}, function(data){
        selfEvents = data.events;
        var counter = data.results_returned;
        $('#self-events+.counter').text(counter);
      });

    };

    var unauthorized = function() {
      $('#settings').addClass('current');
      $('#logout').hide();
    };

    // ログインしていなければ、ログインを促す
    if (T.isConnected()) {
      authorized(T.currentUser);
    } else {
      unauthorized();
    }

    T.bind('authComplete', function(e, user) {
      authorized(user);
    });

    T.bind('signOut', function(e) {
      unauthorized();
    });

    T('#loginButton').connectButton();
    $('#logoutButton').tap(function(e) {
      twttr.anywhere.signOut();
    });
    $('#logoutButton').click(function(e) {
      twttr.anywhere.signOut();
    });
  });
});
