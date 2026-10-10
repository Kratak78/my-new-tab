const API_KEY = import.meta.env.VITE_NASA_API_KEY;

document.querySelector("#app").innerHTML = "loading..."
fetch(`https://api.nasa.gov/planetary/apod?api_key=${API_KEY}`).
then(response => response.json()).then (data => {
    console.log(data);
    document.querySelector("#app").innerHTML = `
    <h1>${data.title}</h1>
    <img src="${data.url}"/>
    <p>${data.explaination}</p>   
    `;
})