import $ from "jquery";
import { Book, Shelf } from "./types/shelf";
import { Chapter, ChaptersRes } from "./types/chapters";
import { ChapterContent } from "./types/chapter";
import "./index.scss";

const base = "http://192.168.31.246:1122";

function init() {
  function setBase() {
    localStorage.base = window.prompt("设置服务地址");
    init();
  }
  const renderTheme = () => {
    return `设置主题(当前:${localStorage.theme === "dark" ? "黑" : "白"})`;
  };
  if (!localStorage.theme) {
    localStorage.theme = "dark";
  }
  $.getJSON(`${base}/getBookshelf`)
    .then((data: Shelf) => {
      $(`<div>
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
          $("html").data("theme", localStorage.theme);
        });
    })
    .fail((er) => {
      console.error(er);
      $('<button class="setBase">设置服务地址</button>')
        .appendTo("#root")
        .on("click", setBase);
    });
  document.addEventListener("keydown", (e) => {
    if (["AudioVolumeDown", "ArrowRight", "ArrowDown"].indexOf(e.key) >= 0) {
      $(".next").trigger("click");
    } else if (["AudioVolumeUp", "ArrowLeft", "ArrowUp"].indexOf(e.key) >= 0) {
      $(".prev").trigger("click");
    }
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
  return $.when(
    $.getJSON(`${base}/getBookContent`, {
      url: book.bookUrl,
      index: chapterIndex,
    })
      .then((data: ChapterContent) => {
        $("#reader .title").text(chapters[chapterIndex].title);
        $("#reader .content").text(data.data);
        if (type === "prev") {
          window.scrollTo(0, document.body.scrollHeight);
        } else {
          window.scrollTo(0, 0);
        }
        return $.ajax({
          url: `${base}/saveBookProgress`,
          data: JSON.stringify({
            author: book.author,
            durChapterIndex: chapterIndex,
            durChapterPos: type === "prev" ? data.data.length : 0,
            durChapterTime: 1684307625485,
            durChapterTitle: chapters[chapterIndex].title,
            name: book.name,
          }),
          method: "post",
          dataType: "json",
          contentType: "application/json",
        });
      })
      .always(() => {
        isOpening = false;
      })
  );
}

function openBook(book: Book) {
  const PageHeight = window.innerHeight - 50 - 30 - 30;

  $.when(
    $.getJSON(`${base}/getChapterList`, {
      url: book.bookUrl,
    }),
    $.getJSON(`${base}/getBookContent`, {
      url: book.bookUrl,
      index: book.durChapterIndex,
    })
  ).then(([chapters]: [ChaptersRes], [chapter]: [ChapterContent]) => {
    curChapterIndex = book.durChapterIndex;
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
      .on("click", ".prev", (e) => {
        if (window.scrollY <= 1) {
          if (curChapterIndex - 1 < 0) {
            alert("已经是第一章了");
          } else {
            openChapter(book, chapters.data, curChapterIndex - 1, "prev");
          }
        } else {
          window.scrollBy(0, -PageHeight);
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
          window.scrollBy(0, PageHeight);
        }
      });
  });
}
init();
