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
var selfEvents, searchEvents, bookmarkEvents, eventDesc;

function getEvents(option, callback) {
  var defaultOption = {
    start: 1,
    count: 31,
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

function getEventDesc(option, callback) {
  var defaultOption = {
    start: 1,
    count: 1,
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
};

function loadEventList(events) {
  var eventsList = $('#events');

  // クリア
  eventsList.children().each(function(){
    $(this).remove();
  });

  // 時系列に並べ替え
  var sort = function(list) {
    if (list.length <= 1) {
      return list;
    }
    
    var center = list[parseInt(list.length/2)];

    var sorter = function (compare) {
      return function(i) {
        var center_date = center.started_at.split('T')[0].replace(/-/g, '');
        if (compare(list[i].started_at.split('T')[0].replace(/-/g, ''), center_date)) {
          return true;
        } else {
          return false;
        }
      };
    };

    var smaller = $(list).filter(sorter(function(a, b){
      if (a < b) {
        return true;
      }
    }));
    var equal = $(list).filter(sorter(function(a, b){
      if (a == b) {
        return true;
      }
    }));
    var greater = $(list).filter(sorter(function(a, b){
      if (a > b) {
        return true;
      }
    }));
    
    var returnValue = [];
    $.each(sort(smaller), function(i, val){
      returnValue.push(val);
    });
    $.each(equal, function(i, val){
      returnValue.push(val);
    });
    $.each(sort(greater), function(i, val){
      returnValue.push(val);
    });

    return returnValue;
  };

  sorted_events = sort(events).reverse();
  
  var date = '';
  $.each(sorted_events, function(i, event) {
    var list = $('<li class="arrow"/>');

    var start_date = event.started_at.split('T')[0];
    if (date != start_date) {
      $('<li class="sep">').text(start_date).appendTo(eventsList);
      date = start_date;
    }

    var link = $('<a id="event_' + event.event_id + '" href="#event-desc">').text(event.title);
    link.bind('tap', function(e) {
      getEventDesc({event_id: event.event_id}, function(data) {
        eventDesc = data.events[0];
        loadEventDesc(eventDesc);
      });
    });

    list.append(link).appendTo(eventsList);
  });
}

function loadEventDesc(event) {
  $('#title').text(event['title']);
  $('#catch').text(event['catch']);
  $('#description').html(event['description']);
  $('#event_url').append($('a').attributes('href', event['event_url']).text(event['event_url']));
}

function getUsers(option, callback) {
  return true; // dummy 
}

// 初期化処理
$(function(){
  window.scrollTo(0, 0);

  $('#search-form').submit(function(e){
    // 検索
    var keyword = e.target.elements['keyword'].value;
    getEvents({keyword: keyword}, function(data){
      searchEvents = data.events;
      loadEventList(searchEvents);
    });

    // リストを表示
    jQT.goTo('#events-list', 'slide');

    e.preventDefault();
    e.stopPropagation();
  });

  $('#self-events').bind('tap', function(e){
    loadEventList(selfEvents);
  });

  // TODO: ブックマーク機能
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
      getEvents({twitter_id: screenName, count: 31}, function(data){
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
    $('#logoutButton').bind('tap', function(e) {
      twttr.anywhere.signOut();
    });
  });
});
