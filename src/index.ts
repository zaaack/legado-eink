import $ from "jquery";
import { Book, Shelf } from "./types/shelf";
import { Chapter, ChaptersRes } from "./types/chapters";
import { ChapterContent } from "./types/chapter";
import "./index.scss";

let base = localStorage.baseUrl || "http://192.168.31.246:1122";
function init() {
  function setBase() {
    localStorage.baseUrl = base = window.prompt("设置服务地址", base) || base;
    init();
  }
  const renderTheme = () => {
    return `设置主题(当前:${localStorage.theme === "dark" ? "黑" : "白"})`;
  };
  if (!localStorage.theme) {
    localStorage.theme = "dark";
  }
  $("html").attr("data-theme", localStorage.theme);
  $.getJSON(`${base}/getBookshelf`)
    .then((data: Shelf) => {
      $(`<div class="home">
    <ul class="books">
    ${data.data
      .map((b, i) => {
        return `<li data-book-index="${i}">${b.name}</li>`;
      })
      .join("")}
    </ul>
    <button class="setBase">设置服务地址</button>
    <button class="setTheme">${renderTheme()}</button>
    </div>`)
        .appendTo($("#root").html(""))
        .on("click", "li", (e) => {
          let book = data.data[+$(e.target).data("book-index")];
          console.log(book);
          openBook(book);
        })
        .on("click", ".setBase", setBase)
        .on("click", ".setTheme", (e) => {
          if (localStorage.theme === "dark") {
            localStorage.theme = "light";
          } else {
            localStorage.theme = "dark";
          }
            $(e.target).html(renderTheme());
          $("html").attr("data-theme", localStorage.theme);
      });
    })
    .fail((er) => {
      console.error(er);
      $('<button class="setBase">设置服务地址</button>')
        .appendTo("#root")
        .on("click", setBase);
    });
  document.addEventListener("keydown", (e) => {
    if ([25, 39, 40].indexOf(e.keyCode) >= 0) {
      $(".next").trigger("click");
      $('#reader').addClass('hideButtons')
      e.preventDefault();
    } else if ([24, 37, 38].indexOf(e.keyCode) >= 0) {
      $(".prev").trigger("click");
      e.preventDefault();
      $('#reader').addClass('hideButtons')
    }
  });
}

let cached = {} as any;
let cachedKeys = [] as string[];
function getBookContent({ url, index }: { url: string; index: number }) {
  if (cachedKeys.length > 6) {
    let shift = cachedKeys.shift()!;
    delete cached[shift];
  }
  const key = (index: number) => url + "|" + index;
  // 自动获取下一章
  $.getJSON(`${base}/getBookContent`, { url, index: index + 1 }).then(
    (data) => {
      cached[key(index + 1)] = data;
      cachedKeys.push(key(index + 1));
    }
  );
  if (key(index) in cached) {
    return $.Deferred()
      .resolve(cached[key(index)])
      .then((d) => d);
  }
  return $.getJSON(`${base}/getBookContent`, { url, index }).then((data) => {
    cached[key(index)] = data;
    cachedKeys.push(key(index));
    return data;
  });
}

let curChapterIndex = 0;
let isOpening = false;
function openChapter(
  book: Book,
  chapters: Chapter[],
  chapterIndex: number,
  type: "prev" | "next"
) {
  if (isOpening) return;
  isOpening = true;
  curChapterIndex = chapterIndex;
  let ci = chapters[chapterIndex];
  $(".header").html(ci.title);
  return getBookContent({
    url: book.bookUrl,
    index: chapterIndex,
  })
    .then((data: ChapterContent) => {
      $("#reader .title").text(ci.title);
      $("#reader .content").text(data.data);
      if (type === "prev") {
        window.scrollTo(0, document.body.scrollHeight);
      } else {
        window.scrollTo(0, 0);
      }
      return $.ajax({
        url: `${base}/saveBookProgress`,
        method: "POST",
        data: JSON.stringify({
          author: book.author,
          durChapterIndex: chapterIndex,
          durChapterPos: type === "prev" ? data.data.length : 0,
          durChapterTime: 1684307625485,
          durChapterTitle: ci.title,
          name: book.name,
        }),
        dataType: "json",
        contentType: "application/json",
      });
    })
    .always(() => {
      isOpening = false;
    });
}
function openBook(book: Book) {
  if (isOpening) return;
  isOpening = true;
  const getPageHeight = () => window.innerHeight - 30 - 15;

  $.when(
    $.getJSON(`${base}/getChapterList`, {
      url: book.bookUrl,
    }).then((d) => d),
    getBookContent({
      url: book.bookUrl,
      index: book.durChapterIndex,
    })
  )
    .then((chapters: ChaptersRes, chapter: ChapterContent) => {
      curChapterIndex = book.durChapterIndex;
      (window as any)['nextChapter'] = () => openChapter(book, chapters.data, curChapterIndex + 1, "next");
      (window as any)['prevChapter'] = () => openChapter(book, chapters.data, curChapterIndex - 1, "prev")
      let ci = chapters.data[curChapterIndex];
      $(`<div id="reader">
      <div class="header">${ci.title}</div>
      <div class="title">${ci.title}</div>
      <div class="content">${chapter.data}</div>
      <div class="buttons">
        <div class="prev">上一页</div>
        <div class="cat">目录</div>
        <div class="next"=>下一页</div>
      </div>
    </div>`)
        .appendTo($("#root").html(""))
        .on('click', '.content', e => {
          $('#reader').removeClass('hideButtons')
        })
        .on("click", ".prev", (e) => {
          if (window.scrollY <= 1) {
            if (curChapterIndex - 1 < 0) {
              alert("已经是第一章了");
            } else {
              openChapter(book, chapters.data, curChapterIndex - 1, "prev");
            }
          } else {
            // 翻页在4.2系统浏览器会闪烁，换老版本chrome30或者uc就不会
            window.scrollBy(0, -getPageHeight());
          }
        })
        .on("click", ".next", (e) => {
          if (
            window.scrollY >=
            document.body.scrollHeight - window.innerHeight - 1
          ) {
            if (curChapterIndex + 1 >= book.totalChapterNum) {
              alert("已经是最后一章了");
            } else {
              openChapter(book, chapters.data, curChapterIndex + 1, "next");
            }
          } else {
            window.scrollBy(0, getPageHeight());
          }
        });
    })
    .always(() => {
      isOpening = false;
    });
}
try {
  init();
} catch (error: any) {
  document.getElementById("#root")!.innerHTML = error.message;
}
