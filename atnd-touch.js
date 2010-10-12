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

  if (events.length == 0) {
    eventsList.append('<li><a href="#">イベントが見つかりません...</a></li>');
  }

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

  var started_at = event['started_at'].split('T');
  var start_date = started_at[0];
  var start_time = started_at[1].replace(/^(\d{2}):(\d{2}):(\d{2}).+/, '\1:\2');

  var ended_at = event['ended_at'].split('T');
  var end_date = ended_at[0];
  if (start_date == end_date) {
    end_date = '';
  }
  var end_time = ended_at[1].replace(/^(\d{2}):(\d{2}):(\d{2}).+/, '\1:\2');

  $('#date').text('日時: ' + [start_date, start_time, 'to', end_date, end_time].join(' '));
  $('#limit').text('参加人数: ' + event['accepted']);
  if (event['limit'] > 0) {
    $('#limit').append(' / ' + event['limit']);
  }
  
  $('#place').text('場所: ' + event['place']);
  if (!!event['address']) {
    $('#place').append("\n(" + event['address'] + ')');
  }

  $('#event_url').append($('<a target="_blank"/>').attr('href', event['event_url']).text('ATNDで開く'));
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
    $('#events-list').append('<div id="progress">読み込み中...</div>');
    getEvents({keyword: keyword}, function(data){
      searchEvents = data.events;
      loadEventList(searchEvents);
      $('#progress').remove();
    });

    // リストを表示
    jQT.goTo('#events-list', 'slide');

    e.preventDefault();
    e.stopPropagation();
  });

  $('#self-events').bind('tap', function(e){
    $('#events-list').append('<div id="progress">読み込み中...</div>');
    loadEventList(selfEvents);
    $('#progress').remove();
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
