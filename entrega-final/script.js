/* ÍNDICE DE JAVASCRIPT

1. Carrusel de proyectos (Universo gráfico)
2. Desplazamiento suave (ScrollSmoother) y viaje del menú
3. Parallax del inicio
4. Sobre mí: entrada desde las esquinas + parallax
5. Logos de los softwares: llegan rodando
6. Galería: estela escalonada (lag)
7. Imágenes: crecen al pasar el mouse y flotan en su lugar
8. Parallax en Mis trabajos y Contactos

*/


// ¿La persona pidió "reducir movimiento" en su dispositivo?
const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Al abrir o recargar la página, siempre empieza en Home (arriba del todo):
// el navegador no recuerda dónde estaba y se quita el #seccion de la dirección
if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
}
if (location.hash) {
    history.replaceState(null, "", location.pathname + location.search);
}
window.scrollTo(0, 0);




/* 1. Carrusel de proyectos
   Muestra un proyecto a la vez. Al tocar una flecha, el proyecto actual
   sale rápido hacia el lado (ease-in) y el siguiente entra por el otro
   lado frenando suave al llegar (ease-out). */

const carrusel = document.querySelector("[data-carrusel]");

if (carrusel) {
    const diapositivas = Array.from(carrusel.querySelectorAll(".diapositiva"));
    const estado = carrusel.querySelector("[data-carrusel-estado]");
    const conAnimacion = window.gsap && !reducirMovimiento;
    let actual = 0;
    let animando = false;

    // Deja el foco en una flecha del nuevo proyecto para seguir navegando con teclado
    function enfocarFlecha(nueva, direccion) {
        const boton = nueva.querySelector(direccion === "siguiente" ? ".boton-siguiente" : ".boton-anterior")
            || nueva.querySelector(".boton-flecha");
        boton.focus({ preventScroll: true });
    }

    // Muestra el proyecto indicado y oculta el anterior
    function mostrarDiapositiva(indice, direccion) {
        const vieja = diapositivas[actual];
        const nueva = diapositivas[indice];
        actual = indice;

        // Avisa a los lectores de pantalla qué proyecto se está viendo
        const nombre = nueva.querySelector(".diapositiva-titulo").textContent;
        estado.textContent = "Proyecto " + (indice + 1) + " de " + diapositivas.length + ": " + nombre;

        if (!conAnimacion) {
            vieja.hidden = true;
            nueva.hidden = false;
            enfocarFlecha(nueva, direccion);
            return;
        }

        // "siguiente": el contenido viejo sale a la izquierda y el nuevo entra desde la derecha
        const lado = direccion === "siguiente" ? 1 : -1;
        const ancho = carrusel.offsetWidth;
        animando = true;
        nueva.hidden = false;

        const etiquetaVieja = vieja.querySelector(".diapositiva-etiqueta");
        const etiquetaNueva = nueva.querySelector(".diapositiva-etiqueta");

        const linea = gsap.timeline({
            onComplete: function () {
                vieja.hidden = true;
                gsap.set([vieja, nueva], { clearProps: "opacity" });
                // Cada pieza vuelve a su lugar e inclinación del diseño
                // (sin borrar el parallax del scroll, que también las mueve)
                gsap.set([contenido(vieja), etiquetaVieja], { x: 0, rotation: 0 });
                imagenes(vieja).forEach(function (imagen) {
                    gsap.set(imagen, { x: 0, scale: 1, rotation: girosImagenes.get(imagen) });
                });
                animando = false;
                enfocarFlecha(nueva, direccion);
            }
        });

        linea
            // Fondo: el viejo se desvanece y el nuevo aparece encima
            .to(vieja, { opacity: 0, duration: 0.6, ease: "none" }, 0)
            .fromTo(nueva, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "none" }, 0.15)
            // Contenido viejo: sale rápido (ease-in: arranca lento y acelera)
            .to([contenido(vieja), etiquetaVieja, imagenes(vieja)], { x: -ancho * lado, duration: 0.45, ease: "power2.in" }, 0)
            // Texto y flechas nuevos: entran y frenan al llegar (ease-out)
            .fromTo(contenido(nueva),
                { x: ancho * lado },
                { x: 0, duration: 0.7, ease: "power3.out" },
                0.3
            )
            // Texto nuevo: un giro muy leve que se endereza con un pequeño rebote
            .fromTo(nueva.querySelector(".diapositiva-texto"),
                { rotation: 4 * lado },
                { rotation: 0, duration: 0.9, ease: "back.out(1.6)" },
                0.3
            )
            // Etiqueta nueva: entra balanceándose y se endereza con un rebote
            .fromTo(etiquetaNueva,
                { x: ancho * lado, rotation: 14 * lado },
                { x: 0, rotation: 0, duration: 1, ease: "back.out(2.2)" },
                0.3
            );

        // Imágenes nuevas: llegan girando y se acomodan a su inclinación del diseño
        imagenes(nueva).forEach(function (imagen, i) {
            const giroFinal = girosImagenes.get(imagen);
            linea.fromTo(imagen,
                { x: ancho * lado, rotation: giroFinal + 35 * lado, scale: 0.85 },
                { x: 0, rotation: giroFinal, scale: 1, duration: 0.9, ease: "back.out(1.4)" },
                0.3 + i * 0.08
            );
        });
    }

    // Lo que se desliza: texto y flechas (la etiqueta y las imágenes van aparte).
    // El fondo de color (franja, textura y flor) solo se desvanece.
    function contenido(diapositiva) {
        return diapositiva.querySelectorAll(".diapositiva-texto, .boton-flecha");
    }
    function imagenes(diapositiva) {
        return diapositiva.querySelectorAll(".diapositiva-imagenes > *");
    }

    // Inclinación del diseño de cada imagen (para devolverlas a su lugar)
    const girosImagenes = new Map();
    if (conAnimacion) {
        carrusel.querySelectorAll(".diapositiva-imagenes > *").forEach(function (imagen) {
            girosImagenes.set(imagen, gsap.getProperty(imagen, "rotation"));
        });
    }

    // Un solo "escuchador" para todas las flechas del carrusel
    carrusel.addEventListener("click", function (evento) {
        const boton = evento.target.closest(".boton-flecha");
        if (!boton || animando) return;

        if (boton.classList.contains("boton-siguiente") && actual < diapositivas.length - 1) {
            mostrarDiapositiva(actual + 1, "siguiente");
        } else if (boton.classList.contains("boton-anterior") && actual > 0) {
            mostrarDiapositiva(actual - 1, "anterior");
        }
    });
}




/* 2. Desplazamiento suave (ScrollSmoother de GSAP)
   Toda la página se desliza suave al hacer scroll. Además, al tocar un enlace
   interno (#inicio, #sobre-mi...), la página viaja hasta la sección:
   arranca rápido y frena suavemente al llegar (ease-out). */

const hayGsap = window.gsap && window.ScrollTrigger && window.ScrollSmoother;
let suavizador = null;

if (hayGsap) {
    gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

    if (!reducirMovimiento) {
        suavizador = ScrollSmoother.create({
            wrapper: "#smooth-wrapper",
            content: "#smooth-content",
            smooth: 1.2,        // segundos que tarda en "alcanzar" al scroll (más = más suave)
            smoothTouch: 0.1    // en celular, muy poquito para que no se sienta pesado
        });

        // Empieza arriba del todo (también cuando terminan de cargar las imágenes)
        suavizador.scrollTop(0);
        window.addEventListener("load", function () {
            suavizador.scrollTop(0);
        });
    }
}

// Si la persona usa la rueda del mouse o el dedo, se detiene el viaje del menú
["wheel", "touchstart"].forEach(function (tipo) {
    window.addEventListener(tipo, function () {
        if (suavizador) gsap.killTweensOf(suavizador);
    }, { passive: true });
});

document.addEventListener("click", function (evento) {
    const enlace = evento.target.closest('a[href^="#"]');
    if (!enlace) return;

    const seccion = document.querySelector(enlace.getAttribute("href"));
    if (!seccion) return;

    evento.preventDefault();

    // Espacio que se deja arriba para que el menú no tape la sección (scroll-margin-top del CSS)
    const margen = parseFloat(getComputedStyle(seccion).scrollMarginTop) || 0;

    if (suavizador) {
        const maximo = ScrollTrigger.maxScroll(window);
        const destino = Math.min(Math.max(suavizador.offset(seccion, "top " + margen + "px"), 0), maximo);
        // La duración crece con la distancia: los viajes largos (por ejemplo de
        // Home a Contactos) no van tan rápido y se ven más fluidos
        const distancia = Math.abs(destino - suavizador.scrollTop());
        const duracion = gsap.utils.clamp(1.2, 2.6, 1 + distancia / 3000);
        gsap.to(suavizador, { scrollTop: destino, duration: duracion, ease: "power3.inOut" });
    } else {
        const destino = seccion.getBoundingClientRect().top + window.scrollY - margen;
        window.scrollTo({ top: destino, behavior: "instant" });
    }

    // Actualiza la dirección (#sobre-mi) y lleva el foco del teclado a la sección
    history.pushState(null, "", enlace.getAttribute("href"));
    seccion.setAttribute("tabindex", "-1");
    seccion.focus({ preventScroll: true });
});




/* 3. Parallax del inicio
   Mientras se hace scroll sobre el inicio, cada capa se mueve a su propia
   velocidad y se agranda un poco, como si se acercara. Todo queda recortado
   dentro del inicio, así que no afecta a las secciones de abajo. */

// velocidad: negativa = sube más rápido que la página (viene hacia ti), positiva = se queda atrás
// zoom: cuánto crece la capa al terminar de pasar el inicio (0.2 = 20 % más grande)
const capasParallax = [
    { selector: ".hero-fondo",            escritorio: 0,     celular: 0,     zoom: 0.08 },
    { selector: ".hero-textura",          escritorio: 0,     celular: 0,     zoom: 0.12 },
    { selector: ".hero-ilustracion",      escritorio: 0,     celular: 0,     zoom: 0.2 },  // queda pegada abajo y crece desde los pies
    { selector: ".hero-titulo",           escritorio: -0.35, celular: -0.25, zoom: 0.15 },
    { selector: ".hero-boton",            escritorio: -0.4,  celular: -0.25, zoom: 0.1 },
    { selector: ".hero-ramas",            escritorio: 0.15,  celular: 0.15,  zoom: 0.15 },
    { selector: ".hero-trazos-izquierda", escritorio: 0.2,   celular: 0.2,   zoom: 0.1 },
    { selector: ".hero-trazos-derecha",   escritorio: 0.2,   celular: 0.2,   zoom: 0.1 }
];

// Mismo punto de quiebre que el CSS responsive
const esCelularOTablet = window.matchMedia("(max-width: 1023px)");

const inicio = document.querySelector(".lienzo-hero");

if (inicio && hayGsap && !reducirMovimiento) {
    const capas = capasParallax
        .map(function (capa) {
            return { elemento: inicio.querySelector(capa.selector), escritorio: capa.escritorio, celular: capa.celular, zoom: capa.zoom };
        })
        .filter(function (capa) {
            return capa.elemento;
        });

    // progreso: 0 arriba del todo, 1 cuando el inicio terminó de salir de la pantalla
    function moverCapas(progreso) {
        const recorrido = progreso * inicio.offsetHeight;

        capas.forEach(function (capa) {
            const velocidad = esCelularOTablet.matches ? capa.celular : capa.escritorio;
            capa.elemento.style.translate = "0 " + (recorrido * velocidad).toFixed(1) + "px";
            capa.elemento.style.scale = (1 + progreso * capa.zoom).toFixed(4);
        });
    }

    // ScrollTrigger avisa el progreso en sincronía con el scroll suave
    ScrollTrigger.create({
        trigger: inicio,
        start: "top top",
        end: "bottom top",
        onUpdate: function (estado) {
            moverCapas(estado.progress);
        }
    });

    moverCapas(0);
}




/* 4. Sobre mí: entrada desde las esquinas + parallax
   La animación va "pegada" al scroll (scrub): al bajar, cada pieza viaja desde
   su esquina hasta su lugar; al seguir bajando, sube a su propia velocidad.
   Si subes, todo se devuelve. */

// x, y: de dónde viene (fracción del ancho / alto de la pantalla; negativo = izquierda / arriba)
// salida: cuánto sube al irse (fracción del alto de la pantalla).
//   Van en orden: lo que está más arriba sube primero y más rápido,
//   así nada se adelanta a lo que tiene encima (por ejemplo, el título no
//   se va antes que la foto).
const piezasSobreMi = [
    { selector: ".estrellas-1",     x: 0.38,  y: -0.15, salida: -0.55 },
    { selector: ".sobre-mi-foto",   x: -0.38, y: -0.12, salida: -0.45 },
    { selector: ".sobre-mi-titulo", x: 0.38,  y: -0.12, salida: -0.38 },
    { selector: ".sobre-mi-intro",  x: 0.42,  y: 0,     salida: -0.34 },
    { selector: ".softwares",       x: -0.38, y: 0.28,  salida: -0.26 },
    { selector: ".sobre-mi-datos",  x: 0.38,  y: 0.28,  salida: -0.22 },
    { selector: ".estrellas-2",     x: -0.38, y: 0.28,  salida: -0.3 }
];

const seccionSobreMi = document.querySelector(".seccion-sobre-mi");

if (seccionSobreMi && hayGsap && !reducirMovimiento) {
    const linea = gsap.timeline({
        scrollTrigger: {
            trigger: seccionSobreMi,
            start: "top 65%",       // empieza cuando la sección ya subió un poco (arriba del todo todo está invisible)
            end: "bottom top",      // termina cuando sale por arriba
            scrub: 1,               // sigue al scroll con 1 s de suavidad
            invalidateOnRefresh: true
        }
    });

    piezasSobreMi.forEach(function (pieza) {
        const elemento = seccionSobreMi.querySelector(pieza.selector);
        if (!elemento) return;

        // Opacidad final de la pieza (las estrellas son transparentes en el diseño)
        const opacidad = parseFloat(getComputedStyle(elemento).opacity);

        // Primera parte (45 % del recorrido): de la esquina a su lugar
        linea.fromTo(elemento,
            {
                x: function () { return pieza.x * window.innerWidth; },
                y: function () { return pieza.y * window.innerHeight; },
                opacity: 0
            },
            { x: 0, y: 0, opacity: opacidad, ease: "power2.out", duration: 0.45 },
            0
        );

        // Segunda parte: parallax al irse
        linea.to(elemento,
            { y: function () { return pieza.salida * window.innerHeight; }, ease: "none", duration: 0.55 },
            0.45
        );
    });

    // El fondo morado también se va con ellos, con un parallax suave
    linea.to(seccionSobreMi.querySelector(".sobre-mi-fondo"),
        { y: function () { return -0.12 * window.innerHeight; }, ease: "none", duration: 0.55 },
        0.45
    );
}



/* 5. Logos de los softwares: llegan rodando
   Cuando bajas hasta Sobre mí, los tres logos entran rodando desde la
   izquierda, uno tras otro, hasta su lugar. Si vuelves hasta arriba del
   todo, se esconden otra vez y vuelven a rodar al bajar. */

const logosSoftware = document.querySelectorAll(".software");

// Se prepara cuando la página terminó de cargar (con imágenes), para que
// el punto donde empieza se calcule con las medidas reales
function prepararLogos() {
    // En celular ruedan antes, más rápido y casi sin espera
    const enCelular = window.matchMedia("(max-width: 1023px)").matches;

    const rodar = gsap.from(logosSoftware, {
        x: function () { return -0.35 * window.innerWidth; }, // desde la izquierda
        rotation: "-=720",          // dos vueltas completas mientras ruedan
        opacity: 0,
        duration: enCelular ? 1.1 : 1.6,
        ease: "power3.out",         // frenan suave al llegar
        stagger: enCelular ? 0.12 : 0.18, // uno tras otro
        immediateRender: true,      // quedan escondidos a la izquierda hasta que llegues
        paused: true                // no ruedan hasta que los llamemos
    });

    // segundos de espera, para que se note después de que llegan las demás piezas
    const ESPERA_ANTES_DE_RODAR = enCelular ? 0.1 : 0.5;
    let espera = null;

    // Al llegar a Sobre mí (bajando): esperan un momento y ruedan
    ScrollTrigger.create({
        trigger: ".seccion-sobre-mi",
        start: enCelular ? "top 45%" : "top 35%", // cuando la sección ya está a la vista
        onEnter: function () {
            if (rodar.progress() === 0 && !espera) {
                espera = gsap.delayedCall(ESPERA_ANTES_DE_RODAR, function () {
                    rodar.play();
                });
            }
        }
    });

    // Al volver hasta arriba del todo, los logos se esconden de nuevo
    ScrollTrigger.create({
        start: 5,
        onLeaveBack: function () {
            if (espera) {
                espera.kill();
                espera = null;
            }
            rodar.pause(0);
        }
    });
}

if (logosSoftware.length && hayGsap && !reducirMovimiento) {
    if (document.readyState === "complete") {
        prepararLogos();
    } else {
        window.addEventListener("load", prepararLogos);
    }
}



/* 6. Galería: estela escalonada (lag)
   Todas las ilustraciones siguen el scroll, pero cada columna llega con un
   poquito más de retraso que la anterior (izquierda → centro → derecha),
   como una estela en cadena. Las de una misma columna van juntas, así que
   no chocan entre sí. */

const RETRASO_INICIAL = 0.15; // segundos de retraso de la primera columna
const RETRASO_POR_COLUMNA = 0.5; // segundos que se suman en cada columna

if (suavizador) {
    const lienzoGaleria = document.querySelector(".lienzo-galeria");
    const tarjetasGaleria = gsap.utils.toArray(".lienzo-galeria .tarjeta-galeria");

    gsap.matchMedia().add({
        computador: "(min-width: 1024px)",
        celular: "(max-width: 1023px)"
    }, function (contexto) {
        const columnas = contexto.conditions.computador ? 3 : 2;
        const anchoColumna = lienzoGaleria.offsetWidth / columnas;

        tarjetasGaleria.forEach(function (tarjeta) {
            // ¿En qué columna está? (según el centro de la tarjeta)
            const centro = tarjeta.offsetLeft + tarjeta.offsetWidth / 2;
            const columna = gsap.utils.clamp(0, columnas - 1, Math.floor(centro / anchoColumna));

            suavizador.effects(tarjeta, {
                speed: 1,
                lag: RETRASO_INICIAL + columna * RETRASO_POR_COLUMNA
            });
        });
    });
}



/* 7. Imágenes: crecen al pasar el mouse y flotan en su lugar
   - Hover: la imagen se agranda y pasa adelante al instante (cada imagen
     que tocas queda por encima de la anterior, aunque esa todavía se esté
     achicando).
   - Flotar: todas suben y bajan muy poquito, cada una a su ritmo. */

const AUMENTO_HOVER = 1.08;   // 1.08 = 8 % más grandes
const ALTURA_FLOTAR = 2.5;    // % de su alto que suben al flotar (muy ligero)

if (hayGsap && !reducirMovimiento) {
    const imagenesInteractivas = document.querySelectorAll(".diapositiva-imagenes .marco, .galeria-lista .tarjeta-galeria");
    let capaMasAlta = 10;

    imagenesInteractivas.forEach(function (imagen) {
        imagen.addEventListener("mouseenter", function () {
            capaMasAlta += 1;
            imagen.style.zIndex = capaMasAlta;   // adelante de inmediato
            gsap.to(imagen, { scale: AUMENTO_HOVER, duration: 0.35, ease: "power2.out", overwrite: "auto" });
        });

        imagen.addEventListener("mouseleave", function () {
            gsap.to(imagen, { scale: 1, duration: 0.35, ease: "power2.out", overwrite: "auto" });
        });

        // Flotar: usa yPercent, que se suma a los otros movimientos sin pisarlos
        gsap.to(imagen, {
            yPercent: -ALTURA_FLOTAR,
            duration: gsap.utils.random(2.6, 4),  // cada una con su propio ritmo
            delay: gsap.utils.random(0, 2),
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1
        });
    });
}



/* 8. Parallax en Mis trabajos y Contactos
   Mientras la sección pasa por la pantalla, cada objeto se mueve a su
   propia velocidad.
   velocidad: positiva = sube más rápido que la página; negativa = más lento

   - Mis trabajos: todo queda en su lugar del diseño cuando la sección está
     en el centro de la pantalla.
   - Contactos (la última sección): el efecto es más fuerte y está calculado
     para que todo termine en su lugar justo al llegar al final de la página. */

function parallaxSeccion(seccion, objetos, opciones) {
    const distancia = function () { return opciones.distancia * window.innerHeight; };

    const linea = gsap.timeline({
        scrollTrigger: {
            trigger: seccion,
            start: "top bottom",
            // al final de la página, o cuando la sección sale por arriba
            end: opciones.terminaAlFinal ? function () { return ScrollTrigger.maxScroll(window); } : "bottom top",
            scrub: true,
            invalidateOnRefresh: true
        }
    });

    objetos.forEach(function (objeto) {
        const elementos = seccion.querySelectorAll(objeto.selector);
        if (!elementos.length) return;

        linea.fromTo(elementos,
            { y: function () { return objeto.velocidad * distancia(); } },
            {
                y: function () { return opciones.terminaAlFinal ? 0 : -objeto.velocidad * distancia(); },
                ease: "none"
            },
            0
        );
    });
}

// Aparece desvaneciéndose desde un lado mientras bajas. La animación va
// pegada al scroll (scrub): si vuelves a subir, se va otra vez.
function aparecerDesdeLado(selector, lado, disparador, inicio, fin) {
    const signo = lado === "izquierda" ? -1 : 1;
    gsap.fromTo(selector,
        { x: function () { return signo * 0.35 * window.innerWidth; }, opacity: 0 },
        {
            x: 0,
            opacity: 1,
            ease: "power2.out",
            scrollTrigger: {
                trigger: disparador,
                start: inicio || "top 95%",  // empieza apenas asoma por abajo
                end: fin || "top 40%",       // ya está en su lugar
                scrub: true,
                invalidateOnRefresh: true
            }
        }
    );
}

if (hayGsap && !reducirMovimiento) {
    parallaxSeccion(document.querySelector(".seccion-trabajos"), [
        { selector: ".diapositiva-etiqueta",                  velocidad: 0.7 },
        { selector: ".diapositiva-imagenes > :nth-child(odd)",  velocidad: 0.35 },
        { selector: ".diapositiva-imagenes > :nth-child(even)", velocidad: 0.1 },
        { selector: ".diapositiva-texto, .boton-flecha",      velocidad: 0.4 },
        { selector: ".diapositiva-flor",                      velocidad: -0.6 }
    ], { distancia: 0.14 });

    // Títulos y dibujos que aparecen desde un lado al bajar (y se van si subes)
    // (los títulos empiezan más tarde y tardan más en llegar, para que se note)
    aparecerDesdeLado(".universo-titulo", "izquierda", ".lienzo-universo", "top 80%", "top 15%");
    aparecerDesdeLado(".galeria-titulo", "izquierda", ".lienzo-titulo-galeria", "top 80%", "top 15%");
    aparecerDesdeLado(".fondo-boceto", "derecha", ".lienzo-titulo-galeria", "top 80%", "top 15%");
    aparecerDesdeLado(".gracias-titulo", "derecha", ".lienzo-contacto");
    // La chica aparece más tarde, pero siempre termina antes del final de la página
    // (clamp: si la página se acaba antes, termina justo al final)
    aparecerDesdeLado(".despedida-ilustracion", "izquierda", ".lienzo-despedida", "clamp(top 70%)", "clamp(top 15%)");

    parallaxSeccion(document.querySelector(".seccion-contactos"), [
        { selector: ".gracias-titulo",                  velocidad: 1 },
        { selector: ".contacto-despedida",              velocidad: 0.85 },
        { selector: ".contacto-nota, .contacto-texto",  velocidad: 0.6 },
        { selector: ".contacto-botones > li",           velocidad: 0.4 },
        { selector: ".despedida-ilustracion",           velocidad: 0.2 }
    ], { distancia: 0.5, terminaAlFinal: true });

    // "See you tomorrow!": da dos saltitos y descansa, una y otra vez
    // (usa yPercent para sumarse al parallax sin pisarlo)
    gsap.timeline({ repeat: -1, repeatDelay: 2.2, delay: 1 })
        .to(".contacto-despedida", { yPercent: -18, duration: 0.25, ease: "power2.out" })
        .to(".contacto-despedida", { yPercent: 0, duration: 0.45, ease: "bounce.out" })
        .to(".contacto-despedida", { yPercent: -8, duration: 0.18, ease: "power2.out" })
        .to(".contacto-despedida", { yPercent: 0, duration: 0.35, ease: "bounce.out" });
}
