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
var selfEvents, bookmarkEvents, searchEvents, bookmarkEvents, eventDesc, users;

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
  if (!events) {
    events = [];
  }

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
        var center_date = center.started_at.replace(/[-T: +]/g, '');
        if (compare(list[i].started_at.replace(/[-T: +]/g, ''), center_date)) {
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

    var title = $('<p/>').text(event.title);
    var place = $('<p class="sub"/>').text(event.place);
    var time = $('<p class="sub"/>').text(getDateString(event.started_at, event.ended_at));

    var link = $('<a id="event_' + event.event_id + '" href="#event-desc">')
                .append(title)
                .append(time)
                .append(place);
    link.bind('tap', function(e) {
      e.preventDefault();
      e.stopPropagation();

      $('#events-list').append('<div id="progress">読み込み中...</div>');
      getUsers({event_id: event.event_id}, function(data) {
        users = data.events[0].users;
        loadUsers(users);
      });
      getEventDesc({event_id: event.event_id}, function(data) {
        eventDesc = data.events[0];
        loadEventDesc(eventDesc);
        $('#progress').remove();

        // 詳細を表示
        jQT.goTo('#event-desc', 'slide');
      });
    });

    list.append(link).appendTo(eventsList);
  });
}

function getDateString(start, end) {
  var started_at = start.split('T');
  var start_date = started_at[0];
  var start_time = started_at[1].replace(/(\d{2}):(\d{2}):(\d{2}).+/, '$1:$2');

  if (!!end) {
    var ended_at = end.split('T');
    var end_date = ended_at[0];
    if (start_date == end_date) {
      end_date = '';
    }
    var end_time = ended_at[1].replace(/(\d{2}):(\d{2}):(\d{2}).+/, '$1:$2');
  }

  return [start_date, start_time, 'to', end_date, end_time].join(' ');
}

function loadEventDesc(event) {
  $('#title').text(event['title']);
  $('#catch').text(event['catch']);

  $('#date').text('日時: ' + getDateString(event['started_at'], event['ended_at']));
  $('#limit').text('参加人数: ' + event['accepted']);
  if (event['limit'] > 0) {
    $('#limit').append(' / ' + event['limit']);
  }
  
  $('#place').children().remove();
  var placeStr = event['place'];
  if (!!event['address']) {
    placeStr += "\n(" + event['address'] + ')';
  }

  if (!!event['lat'] && !!event['lon']) {
    var placeLink = $('<a target="_blank"/>')
                    .text(placeStr)
                    .attr('href',
                          'http://www.google.co.jp/maps?q='
                          +event['lat']+','+event['lon']
                          +'('+event['place']+')'
                          +'&z=19'
                         );
    $('#place').addClass('forward').append(placeLink);
  } else {
    $('#place').text(placeStr);
    $('#place').removeClass('forward');
  }

  $('#event_url').children().remove();
  $('#event_url').append($('<a target="_blank"/>').attr('href', event['event_url']).text('ATNDで開く'));

  // ブックマーク機能
  var bm_btn = $('#bookmark-button');
  if (bookmarked(event['event_id'])) {
    bm_btn.text('ブックマーク外す');
  } else {
    bm_btn.text('ブックマークする');
  }

  // ブックマークのイベント割り当て
  bm_btn.unbind();
  bm_btn.bind('tap', function(e){
    e.preventDefault();
    e.stopPropagation();

    if (bookmarked(event['event_id'])) {
      delFromBookmark(event['event_id']);
      bm_btn.text('ブックマークする');
    } else {
      addToBookmark(event['event_id']);
      bm_btn.text('ブックマーク外す');
    }
  });
}

function getUsers(option, callback) {
  var defaultOption = {
    start: 1,
    count: 200,
    format: 'jsonp'
  };

  var query = defaultOption;

  $.each(option, function(key, val) {
    query[key] = val;
  });

  $.getJSON(
    'http://api.atnd.org/events/users/?callback=?',
    query,
    callback
  );
}

function loadUsers(users) {
  var userList = $('#users');
  userList.children().remove();
  $.each(users, function(i, user) {
    var userItem = $('<li/>');
    var userLink = $('<a/>').text(user.nickname);
    if (!!user.twitter_id) {
      userItem.addClass('forward');
      userLink.attr({href: 'http://twitter.com/'+user.twitter_id, target: '_blank'});
    }
    userItem.append(userLink).appendTo(userList);
  });
}

function refreshBookmarkCounter() {
  var stored = localStorage.bookmarks;
  if (!!stored) {
    $('#bookmark-events+.counter').text(localStorage.bookmarks.split(',').length);
  } else {
    $('#bookmark-events+.counter').text('0');
  }
}

function addToBookmark(event_id) {
  var stored = localStorage.bookmarks;
  if (!!stored) {
    localStorage.bookmarks = stored.split(',').push(event_id).join(',');
  } else {
    localStorage.bookmarks = event_id;
  }
  refreshBookmarkCounter();
}

function bookmarked(event_id) {
  var stored = localStorage.bookmarks;
  if (!!stored) {
    $.each(stored.split(','), function(i) {
      if (i == event_id) {
        return true;
      }
    });
  }
  refreshBookmarkCounter();
  return false;
}

function delFromBookmark(event_id) {
  var stored = localStorage.bookmarks;
  if (!stored) return;

  var new_stored = [];
  $.each(stored.split(','), function(i) {
    if (i != event_id) {
      new_stored.push(i);
    }
  });
  localStorage.bookmarks = new_stored.join(',');
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

  // 自身の参加イベントを取得
  var twitter_id = localStorage.twitter_id;
  if (!!twitter_id) {
    $('#twitter_id').val(twitter_id);
    getEvents({twitter_id: twitter_id, count: 31}, function(data){
      selfEvents = data.events;
      var counter = data.results_returned;
      $('#self-events+.counter').text(counter);
    });
  } else {
    jQT.goTo('#settings');
  }

  // ブックマーク機能
  var bookmarks = localStorage.bookmarks;
  if (!!bookmarks) {
    $('#bookmark-events+.counter').text(bookmarks.length);
  } else {
    $('#bookmark-events+.counter').text('0');
  }

  $('#bookmark-events').bind('tap', function(e){
    $('#events-list').append('<div id="progress">読み込み中...</div>');
    loadEventList(bookmarkEvents);
    $('#progress').remove();
  });

  $('#bookmark-reset-button').bind('tap', function(e){
    e.preventDefault();
    e.stopPropagation();

    localStorage.bookmarks = '';
    $('#bookmark-events+.counter').text('0');
  });

  $('#settings-form').submit(function(e){
    var twitter_id = $('#twitter_id').val();
    if (!!twitter_id) {
      // 設定を保存
      localStorage.twitter_id = twitter_id;

      // リストを表示
      getEvents({twitter_id: twitter_id, count: 31}, function(data){
        selfEvents = data.events;
        var counter = data.results_returned;
        $('#self-events+.counter').text(counter);
      });
      $('#message').text('');

      jQT.goTo('#home', 'flip', true);
    } else {
      localStorage.twitter_id = $('#twitter_id').val();
      $('#self-events+.counter').text('#');
      $('#message').text('TwitterIDを入力してください。');
    }

    e.preventDefault();
    e.stopPropagation();
  });
});
