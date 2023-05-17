(function () {
  '';

  

  function ___$insertStyle(css) {
      if (!css || typeof window === 'undefined') {
          return;
      }
      const style = document.createElement('style');
      style.setAttribute('type', 'text/css');
      style.innerHTML = css;
      document.head.appendChild(style);
      return css;
  }

  ___$insertStyle("html {\n  transform: translateZ(0);\n}\n\nbody {\n  margin: 0;\n  padding: 0;\n  font-size: 20px;\n}\n\n.home {\n  padding: 20px 0;\n}\n\n.books {\n  list-style: none;\n  padding: 0;\n  margin: 0;\n}\n.books li {\n  padding: 10px;\n  font-size: 25px;\n  border-bottom: 1px solid #aaa;\n}\n\n#reader {\n  padding: 10px;\n  padding-bottom: 50px;\n  padding-top: 30px;\n}\n#reader.hideButtons {\n  padding-bottom: 10px;\n}\n#reader.hideButtons .buttons {\n  display: none;\n}\n#reader .header {\n  position: fixed;\n  left: 0;\n  top: 0;\n  width: 100%;\n  height: 30px;\n  line-height: 30px;\n  font-size: 14px;\n  color: #999;\n  background-color: #fff;\n}\nhtml[data-theme=dark] #reader .header {\n  color: #ccc;\n  background-color: #000;\n}\n\nhtml[data-theme=dark] #reader {\n  background-color: #000;\n  color: #fff;\n}\n\n#reader .title {\n  font-size: 40px;\n  font-weight: bold;\n}\n#reader .content {\n  font-size: 35px;\n  white-space: pre-line;\n  line-height: 1.5;\n}\n#reader .buttons {\n  height: 40px;\n  line-height: 40px;\n  width: 100%;\n  position: fixed;\n  bottom: 0;\n  left: 0;\n  background-color: #fff;\n  overflow: hidden;\n}\nhtml[data-theme=dark] #reader .buttons {\n  background-color: #000;\n}\n\n#reader .buttons div {\n  width: 33%;\n  float: left;\n  text-align: center;\n  border: 1px solid #000;\n}\nhtml[data-theme=dark] #reader .buttons div {\n  border-color: #fff;\n}");

  var base = localStorage.baseUrl || "http://192.168.31.246:1122";
  function init() {
      function setBase() {
          localStorage.baseUrl = base = window.prompt("设置服务地址", base) || base;
          init();
      }
      var renderTheme = function () {
          return "\u8BBE\u7F6E\u4E3B\u9898(\u5F53\u524D:".concat(localStorage.theme === "dark" ? "黑" : "白", ")");
      };
      if (!localStorage.theme) {
          localStorage.theme = "dark";
      }
      $("html").attr("data-theme", localStorage.theme);
      $.getJSON("".concat(base, "/getBookshelf"))
          .then(function (data) {
          $("<div class=\"home\">\n    <ul class=\"books\">\n    ".concat(data.data
              .map(function (b, i) {
              return "<li data-book-index=\"".concat(i, "\">").concat(b.name, "</li>");
          })
              .join(""), "\n    </ul>\n    <button class=\"setBase\">\u8BBE\u7F6E\u670D\u52A1\u5730\u5740</button>\n    <button class=\"setTheme\">").concat(renderTheme(), "</button>\n    </div>"))
              .appendTo($("#root").html(""))
              .on("click", "li", function (e) {
              var book = data.data[+$(e.target).data("book-index")];
              console.log(book);
              openBook(book);
          })
              .on("click", ".setBase", setBase)
              .on("click", ".setTheme", function (e) {
              if (localStorage.theme === "dark") {
                  localStorage.theme = "light";
              }
              else {
                  localStorage.theme = "dark";
              }
              $(e.target).html(renderTheme());
              $("html").attr("data-theme", localStorage.theme);
          });
      })
          .fail(function (er) {
          console.error(er);
          $('<button class="setBase">设置服务地址</button>')
              .appendTo("#root")
              .on("click", setBase);
      });
      document.addEventListener("keydown", function (e) {
          if ([25, 39, 40].indexOf(e.keyCode) >= 0) {
              $(".next").trigger("click");
              $('#reader').addClass('.hideButtons');
              e.preventDefault();
          }
          else if ([24, 37, 38].indexOf(e.keyCode) >= 0) {
              $(".prev").trigger("click");
              e.preventDefault();
              $('#reader').addClass('.hideButtons');
          }
      });
  }
  var cached = {};
  var cachedKeys = [];
  function getBookContent(_a) {
      var url = _a.url, index = _a.index;
      if (cachedKeys.length > 6) {
          var shift = cachedKeys.shift();
          delete cached[shift];
      }
      var key = function (index) { return url + "|" + index; };
      // 自动获取下一章
      $.getJSON("".concat(base, "/getBookContent"), { url: url, index: index + 1 }).then(function (data) {
          cached[key(index + 1)] = data;
          cachedKeys.push(key(index + 1));
      });
      if (key(index) in cached) {
          return $.Deferred()
              .resolve(cached[key(index)])
              .then(function (d) { return d; });
      }
      return $.getJSON("".concat(base, "/getBookContent"), { url: url, index: index }).then(function (data) {
          cached[key(index)] = data;
          cachedKeys.push(key(index));
          return data;
      });
  }
  var curChapterIndex = 0;
  var isOpening = false;
  function openChapter(book, chapters, chapterIndex, type) {
      if (isOpening)
          return;
      isOpening = true;
      curChapterIndex = chapterIndex;
      var ci = chapters[chapterIndex];
      $(".header").html(ci.title);
      return getBookContent({
          url: book.bookUrl,
          index: chapterIndex
      })
          .then(function (data) {
          $("#reader .title").text(ci.title);
          $("#reader .content").text(data.data);
          if (type === "prev") {
              window.scrollTo(0, document.body.scrollHeight);
          }
          else {
              window.scrollTo(0, 0);
          }
          return $.ajax({
              url: "".concat(base, "/saveBookProgress"),
              method: "POST",
              data: JSON.stringify({
                  author: book.author,
                  durChapterIndex: chapterIndex,
                  durChapterPos: type === "prev" ? data.data.length : 0,
                  durChapterTime: 1684307625485,
                  durChapterTitle: ci.title,
                  name: book.name
              }),
              dataType: "json",
              contentType: "application/json"
          });
      })
          .always(function () {
          isOpening = false;
      });
  }
  function openBook(book) {
      if (isOpening)
          return;
      isOpening = true;
      var getPageHeight = function () { return window.innerHeight - 50 - 30 - 30; };
      $.when($.getJSON("".concat(base, "/getChapterList"), {
          url: book.bookUrl
      }).then(function (d) { return d; }), getBookContent({
          url: book.bookUrl,
          index: book.durChapterIndex
      }))
          .then(function (chapters, chapter) {
          curChapterIndex = book.durChapterIndex;
          window['nextChapter'] = function () { return openChapter(book, chapters.data, curChapterIndex + 1, "next"); };
          window['prevChapter'] = function () { return openChapter(book, chapters.data, curChapterIndex - 1, "prev"); };
          var ci = chapters.data[curChapterIndex];
          $("<div id=\"reader\" class=\"hideButtons\">\n      <div class=\"header\">".concat(ci.title, "</div>\n      <div class=\"title\">").concat(ci.title, "</div>\n      <div class=\"content\">").concat(chapter.data, "</div>\n      <div class=\"buttons\">\n        <div class=\"prev\">\u4E0A\u4E00\u9875</div>\n        <div class=\"cat\">\u76EE\u5F55</div>\n        <div class=\"next\"=>\u4E0B\u4E00\u9875</div>\n      </div>\n    </div>"))
              .appendTo($("#root").html(""))
              .on('click', '.content', function (e) {
              $('#reader').removeClass('.hideButtons');
          })
              .on("click", ".prev", function (e) {
              if (window.scrollY <= 1) {
                  if (curChapterIndex - 1 < 0) {
                      alert("已经是第一章了");
                  }
                  else {
                      openChapter(book, chapters.data, curChapterIndex - 1, "prev");
                  }
              }
              else {
                  window.scrollBy(0, -getPageHeight() / 2);
                  window.scrollBy(0, -getPageHeight() / 2);
              }
          })
              .on("click", ".next", function (e) {
              if (window.scrollY >=
                  document.body.scrollHeight - window.innerHeight - 1) {
                  if (curChapterIndex + 1 >= book.totalChapterNum) {
                      alert("已经是最后一章了");
                  }
                  else {
                      openChapter(book, chapters.data, curChapterIndex + 1, "next");
                  }
              }
              else {
                  window.scrollBy(0, getPageHeight() / 2);
                  window.scrollBy(0, getPageHeight() / 2);
              }
          });
      })
          .always(function () {
          isOpening = false;
      });
  }
  try {
      init();
  }
  catch (error) {
      document.getElementById("#root").innerHTML = error.message;
  }

})();
//# sourceMappingURL=bundle.78041c.js.map
