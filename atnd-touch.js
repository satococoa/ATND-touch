var jQT = new $.jQTouch({
  icon: 'atnd-touch-icon.png',
  startupScreen: 'atnd-touch-startup.png',
  statusBar: 'black-translucent',
  preloadImages: [
    'themes/jqt/img/back_button_clicked.png',
    'themes/jqt/img/button_clicked.png'
  ]
});

// 関数、グローバル変数
var selfEvents, searchEvents, bookmarkEvents;

function getEvents(option, callback) {
  var defaultOption = {
    start: 1,
    count: 11,
    format: 'jsonp'
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

function loadEventList(events) {
  var eventsList = $('#events');

  // クリア
  eventsList.children().each(function(){
    $(this).remove();
  });
  
  var date = '';
  $.each(events, function(i, event) {
    var list = $('<li class="arrow"/>');

    var start_date = event.started_at.split('T')[0];
    var start_time = event.started_at.split('T')[1];
    var end_date = event.ended_at.split('T')[0];
    if (start_date == end_date) {
      end_date = '';
    }
    var end_time = event.ended_at.split('T')[1];
    if (date != start_date) {
      $('<li class="sep">').text(start_date).appendTo(eventsList);
      date = start_date;
    }

    var link = $('<a href="#">').text(event.title);
    list.append(link).appendTo(eventsList);
  });

  // リストを表示
  jQT.goTo('#events-list', 'slide');
}

function getUsers(option, callback) {
  return true; // dummy 
}

// 初期化処理
$(function(){
  window.scrollTo(0, 0);

  $('#search-form').submit(function(e){
    e.preventDefault();
    e.stopPropagation();

    // 検索
    var keyword = e.target.elements['keyword'].value;
    getEvents({keyword: keyword}, function(data){
      searchEvents = data.events;
      loadEventList(searchEvents);
    });
  });

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
