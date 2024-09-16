// quill editor
function createQuillEditor(quillElmID, imageHandler) {
    const myToolbar = [
        [{ "header": 1 }, { "header": 2 }, 'bold', 'italic', 'underline', 'strike', 'link'],
        ['blockquote', 'code', 'code-block', { "script": "sub" }, { "script": "super" }],
        ['indent', { "list": "ordered" }, { "list": "bullet" }]

        [{ 'color': [] }, { 'background': [] }],
        [{ 'font': [] }, { 'size': [] }],
        [{ 'align': [] }, { "direction": "rtl" }],

        ['clean'],
        ['image'],
        ['video']
    ];

    let quill = new Quill(`#${quillElmID}`, {
        modules: {
            toolbar: {
                container: myToolbar,
                handlers: {
                    image: imageHandler
                }
            }
        },
        placeholder: 'Tulis content di sini...',
        theme: 'snow'
    });

    return quill;
}

// tags input
function randomizeTagsColor() {
    let colors = [
        "primary",
        "secondary",
        "success",
        "danger",
        "warning",
        "info",
        "dark"
    ];

    const randomColorIndex = Math.floor(Math.random() * colors.length);
    const randomColor = colors[randomColorIndex];
    return randomColor;
}

function registerOnEnterTags(txTagsElmID, txaDivTagsElmID) {
    $(`#${txTagsElmID}`).keypress(function (e) {
        if (e.which == 13) {
            $(`#${txaDivTagsElmID}`).append(`<span class="badge bg-${randomizeTagsColor()}">${$(`#${txTagsElmID}`).val()}</span> `);
            $(`#${txTagsElmID}`).val("");
            e.preventDefault();
        }
    });
}

function registerOnClickAtTags(txaDivTagsElmID) {
    $(`#${txaDivTagsElmID}`).on("click", "span.badge", function (e) {
        $(this).remove();
    });
}

function parseTagsInput(txaTagsElmID, txaDivTagsElmID) {
    document.getElementById(txaTagsElmID).value = "";
    $(`#${txaDivTagsElmID}`).children(`.badge`).each(function () {
        document.getElementById(txaTagsElmID).value += $(this).text() + ",";
    });
}

function loadTagsInput(txaTagsElmID, txaDivTagsElmID) {
    let tags = document.getElementById(txaTagsElmID).value.split(",").filter((item) => {
        return item;
    });

    tags.forEach(function (item, index) {
        $(`#${txaDivTagsElmID}`).append(`<span class="badge bg-${randomizeTagsColor()}">${item}</span> `);
    });
}

// etc
async function fetchJSON(url) {
    const results = await fetch(url);
    return results.json();
}