const submitButton = document.querySelector("input[type='submit']");
submitButton.addEventListener('click', e => {
    const inputText = document.querySelector("input[type='text']");
    let user = inputText.value;
    document.cookie = `user=${user}`;
    window.location.href = "http://localhost:4000/draw.html";
})