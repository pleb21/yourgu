const shapeTab = document.getElementById("shapeTab");
const colorTab = document.getElementById("colorTab");
const shapeSection = document.getElementById("shapeSection");
const colorSection = document.getElementById("colorSection");

shapeTab.addEventListener("click", () => {
  shapeSection.classList.remove("hidden");
  colorSection.classList.add("hidden");
});

colorTab.addEventListener("click", () => {
  colorSection.classList.remove("hidden");
  shapeSection.classList.add("hidden");
});
