var jQT = new $.jQTouch({
  icon: 'atnd-touch-icon.png',
  startupScreen: 'atnd-touch-startup.png',
  statusBar: 'black-translucent',
  preloadImages: [
    'themes/jqt/img/chevron_white.png',
    'themes/jqt/img/bg_row_select.gif',
    'themes/jqt/img/back_button_clicked.png',
    'themes/jqt/img/button_clicked.png'
  ]
});

$(function(){
  window.scrollTo(0, 0);

  // ログインしていなければ、ログインを促す
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
    };

    var unauthorized = function() {
      $('#settings').addClass('current');
      $('#logout').hide();
    };

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
    $('#logout').tap(function(e) {
      twttr.anywhere.signOut();
    });
    $('#logout').click(function(e) {
      twttr.anywhere.signOut();
    });
  });
});
