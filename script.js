let currentIndex = 0;
const carouselItems = document.querySelectorAll('.carousel-item');
const totalItems = carouselItems.length;
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');

// Mostrar la imagen en base al índice actual
function updateCarousel() {
    const itemWidth = document.querySelector('.carousel').offsetWidth;
    const offset = -currentIndex * itemWidth;
    document.querySelector('.carousel').style.transform = `translateX(${offset}px)`;
}

// Avanzar a la siguiente imagen
function showNextImage() {
    currentIndex = (currentIndex + 1) % totalItems;
    updateCarousel();
}

// Retroceder a la imagen anterior
function showPrevImage() {
    currentIndex = (currentIndex - 1 + totalItems) % totalItems;
    updateCarousel();
}

// Asignar eventos a los botones
nextBtn.addEventListener('click', showNextImage);
prevBtn.addEventListener('click', showPrevImage);

// Recalcular el tamaño al redimensionar la ventana
window.addEventListener('resize', updateCarousel);


document.addEventListener("DOMContentLoaded", function() {
    updateCarousel();
});
