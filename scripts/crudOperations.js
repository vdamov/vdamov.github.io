const BASE_URL = 'https://baas.kinvey.com/';
const APP_KEY = 'kid_S1Wgm-67Q';
const APP_SECRET = 'b9fe0ed6146344af8e1d90d4cc5b7678';
const AUTH_HEADERS = {'Authorization': "Basic " + btoa(APP_KEY + ":" + APP_SECRET)};
const BOOKS_PER_PAGE = 10;

function loginUser() {
    let username = $('#formLogin input[name="username"]').val();
    let password = $('#formLogin input[name="passwd"]').val();
    $.ajax({
        method: 'POST',
        url: BASE_URL + 'user/' + APP_KEY + '/login',
        headers: AUTH_HEADERS,
        data: {username, password}
    }).done(function (res) {
        signInUser(res, 'Login successful.')
    }).fail(handleAjaxError)
}

function registerUser() {
    let username = $('#formRegister input[name="username"]').val();
    let password = $('#formRegister input[name="passwd"]').val();
    $.ajax({
        method: 'POST',
        url: BASE_URL + 'user/' + APP_KEY,
        headers: AUTH_HEADERS,
        data: {username, password}
    }).done(function (res) {
        signInUser(res, 'Registration successful.')
    }).fail(handleAjaxError);
}

function listBooks() {
    $.ajax({
        method: 'GET',
        url: BASE_URL + 'appdata/' + APP_KEY + '/books',
        headers: {Authorization: 'Kinvey ' + getCookie('authToken')}
    }).then(function (res) {
        res = res.sort(listSort($('.sorting select').val()));
        displayPaginationAndBooks(res)
    }).catch(handleAjaxError)
}


function createBook() {
    let title = $('#formCreateBook input[name="title"]').val();
    let author = $('#formCreateBook input[name="author"]').val();
    let description = $('#formCreateBook textarea[name="description"]').val();


    $.ajax({
        method: "POST",
        url: BASE_URL + 'appdata/' + APP_KEY + '/books',
        headers: {'Authorization': "Kinvey " + getCookie('authToken')},
        data: {title, author, description}
    }).done(function () {
        listBooks();
        showInfo('Book created.')
    }).fail(handleAjaxError)
}

function deleteBook(book) {
    $.ajax({
        method: "DELETE",
        url: BASE_URL + 'appdata/' + APP_KEY + '/books/' + book._id,
        headers: {'Authorization': "Kinvey " + getCookie('authToken')}
    }).done(function () {
        listBooks();
        showInfo('Book deleted.')
    }).fail(handleAjaxError)
}

function loadBookForEdit(book) {
    $('#formEditBook input[name="id"]').val(book._id);
    $('#formEditBook input[name="title"]').val(book.title);
    $('#formEditBook input[name="author"]').val(book.author);
    $('#formEditBook textarea[name="description"]').val(book.description);
    showView('viewEditBook');
}

function editBook() {
    let id = $('#formEditBook input[name="id"]').val();
    let title = $('#formEditBook input[name="title"]').val();
    let author = $('#formEditBook input[name="author"]').val();
    let description = $('#formEditBook textarea[name="description"]').val();

    $.ajax({
        method: "PUT",
        url: BASE_URL + 'appdata/' + APP_KEY + '/books/' + id,
        headers: {'Authorization': "Kinvey " + getCookie('authToken')},
        data: {title, author, description}
    }).done(function () {
        listBooks();
        showInfo('Book edited.')
    }).fail(handleAjaxError)
}

function saveAuthInSession(userInfo) {
    setCookie(`authToken`, userInfo._kmd.authtoken, 1);
    setCookie(`username`, userInfo.username, 1);
    setCookie(`userId`, userInfo._id, 1);
}

function logoutUser() {
    $.ajax({
        method: 'POST',
        url: BASE_URL + 'user/' + APP_KEY + '/_logout',
        headers: {'Authorization': "Kinvey " + getCookie('authToken')},
    }).done(function () {
        eraseCookie(`authToken`);
        eraseCookie(`username`);
        eraseCookie(`userId`);
        showHideMenuLinks();
        showHomeView();
        showInfo('Logout successful.')
    }).fail(handleAjaxError)
}

function signInUser(res, message) {
    saveAuthInSession(res);
    showHideMenuLinks();
    showHomeView();
    showInfo(message)
}

function listSort(selected) {
    let sorted;
    if (selected === `Date Modified`) {
        sorted = function (a, b) {
            let d1 = new Date(a._kmd.lmt)
            let d2 = new Date(b._kmd.lmt)
            return d2 - d1;
        }
    }
    else if (selected === `Date Created`) {
        sorted = function (a, b) {
            let d1 = new Date(a._kmd.ect)
            let d2 = new Date(b._kmd.ect)
            return d2 - d1;
        }
    } else if (selected === 'Title (A-Z)') {
        sorted = function (a, b) {
            return a.title.localeCompare(b.title)
        }
    } else if (selected === `Author (A-Z)`) {
        sorted = function (a, b) {
            return a.author.localeCompare(b.author)

        }
    }

    return sorted;

}

function displayPaginationAndBooks(books) {
    let select = $('.sorting select');
    select.on('change', function () {
            books = books.sort(listSort($(this).val()));
            displayPaginationAndBooks(books)
        }
    );


    showView('viewBooks')

    let pagination = $('#pagination-demo')
    if (pagination.data("twbs-pagination")) {
        pagination.twbsPagination('destroy')
    }
    pagination.twbsPagination({
        totalPages: Math.ceil(books.length / BOOKS_PER_PAGE),
        visiblePages: 5,
        next: 'Next',
        prev: 'Prev',
        onPageClick: function (event, page) {
            $('#books > table tr').each((index, element) => {
                if (index > 0) {
                    $(element).remove()
                }
            });
            let startBook = (page - 1) * BOOKS_PER_PAGE;
            let endBook = Math.min(startBook + BOOKS_PER_PAGE, books.length);
            $(`a:contains(${page})`).addClass('active');
            for (let i = startBook; i < endBook; i++) {
                let tr = $(`<tr><td>${books[i].title}</td>` +
                    `<td>${books[i].author}</td>` +
                    `<td>${books[i].description}</td>`);
                $('#books > table').append(tr);
                if (books[i]._acl.creator === getCookie(`userId`)) {
                    let aDel = $('<button>Delete</button>').on('click', function () {
                        deleteBook(books[i])
                    });
                    let aEdit = $('<button>Edit</button>').on('click', function () {
                        loadBookForEdit(books[i])
                    });
                    tr.append($(`<td>`).append(aEdit).append(aDel))
                }
            }
        }
    })
}

function setCookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function eraseCookie(name) {
    setCookie(name, "", -1);
}

function handleAjaxError(response) {
    let errorMsg = JSON.stringify(response)
    if (response.readyState === 0)
        errorMsg = "Cannot connect due to network error."
    if (response.responseJSON && response.responseJSON.description)
        errorMsg = response.responseJSON.description
    showError(errorMsg)
}