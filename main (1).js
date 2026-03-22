const JWT_TOKEN = localStorage.getItem("jwt_token");

const opcionesJWT = JWT_TOKEN
    ? { headers: { "Authorization": `Bearer ${JWT_TOKEN}` } }
    : {};

const API_PERSONAJES  = "https://jocaravena.laboratoriodiseno.cl/wordpress/wp-json/wp/v2/personajes?_embed&per_page=100";
const API_PELICULAS   = "https://jocaravena.laboratoriodiseno.cl/wordpress/wp-json/wp/v2/peliculas?_embed";
const API_TEMPORADAS  = "https://jocaravena.laboratoriodiseno.cl/wordpress/wp-json/wp/v2/temporadas?_embed";
const API_SECUELAS    = "https://jocaravena.laboratoriodiseno.cl/wordpress/wp-json/wp/v2/secuelas?_embed";
const GRAPHQL_URL     = "https://jocaravena.laboratoriodiseno.cl/wordpress/graphql";

// ===============================
// UN SOLO DOMContentLoaded
// ===============================
document.addEventListener("DOMContentLoaded", () => {

    const contenedorPersonajes = document.querySelector("#character");
    const contenedorPeliculas  = document.querySelector("#movies");
    const contenedorTemporadas = document.querySelector("#seasons");
    const contenedorSecuelas   = document.querySelector("#sequel");

    if (contenedorPersonajes)  cargarDatos(API_PERSONAJES,  contenedorPersonajes);
    if (contenedorPeliculas)   cargarDatos(API_PELICULAS,   contenedorPeliculas);
    if (contenedorTemporadas)  cargarDatos(API_TEMPORADAS,  contenedorTemporadas);
    if (contenedorSecuelas)    cargarDatos(API_SECUELAS,    contenedorSecuelas);

    if (document.querySelector("#contenedor-tecnicas")) cargarTecnicas();
    if (document.querySelector("#contenedor-objetos"))  cargarObjetosMalditos();

    // MODAL - eventos
    document.getElementById("modal-cerrar").addEventListener("click", cerrarModal);
    document.getElementById("modal-overlay").addEventListener("click", function(e) {
        if (e.target === this) cerrarModal();
    });
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape") cerrarModal();
    });

    // BUSCADOR - eventos
    const inputBuscar   = document.getElementById("input-buscar");
    const filtroSeccion = document.getElementById("filtro-seccion");
    if (inputBuscar)   inputBuscar.addEventListener("input", aplicarFiltro);
    if (filtroSeccion) filtroSeccion.addEventListener("change", aplicarFiltro);

});

// ==========================
// CARGAR DATOS REST API
// ==========================
async function cargarDatos(apiUrl, contenedor) {
    try {
        const respuesta = await fetch(apiUrl, opcionesJWT);
        const datos = await respuesta.json();

        contenedor.innerHTML = "";
        datos.forEach(post => {
            contenedor.appendChild(crearCard(post));
        });

        aplicarFiltro(); // filtra luego de cargar

    } catch (error) {
        console.error("Error al cargar datos:", error);
        contenedor.innerHTML = "<p>Error al cargar contenido</p>";
    }
}

// ====================
// CREAR CARDS
// ====================
function crearCard(post) {
    const card = document.createElement("article");
    card.classList.add("card");

    let imagen = "";
    if (post._embedded?.["wp:featuredmedia"]?.[0]) {
        imagen = post._embedded["wp:featuredmedia"][0].source_url;
    }

    const estado = post.acf?.estado || "";

    card.innerHTML = `
        ${imagen ? `<img src="${imagen}" alt="${post.title.rendered}">` : ""}
        <div class="card-content">
            <h3>${post.title.rendered}</h3>
            ${estado ? `<div class="status ${estado}">${estado === "vivo" ? "Vivo" : "Muerto"}</div>` : ""}
            <div class="info">${post.content.rendered}</div>
        </div>
    `;

    card.addEventListener("click", () => {
        abrirModal(post.title.rendered, post.content.rendered, imagen);
    });

    return card;
}

// ==========================
// BUSCADOR CON FILTROS
// ==========================
function aplicarFiltro() {
    const inputBuscar   = document.getElementById("input-buscar");
    const filtroSeccion = document.getElementById("filtro-seccion");
    if (!inputBuscar || !filtroSeccion) return;

    const texto   = inputBuscar.value.toLowerCase().trim();
    const seccion = filtroSeccion.value;
    const secciones = ["character", "movies", "seasons", "sequel"];

    secciones.forEach(id => {
        const contenedor = document.getElementById(id);
        if (!contenedor) return;

        const h2 = contenedor.previousElementSibling;

        if (seccion !== "todos" && seccion !== id) {
            contenedor.style.display = "none";
            if (h2 && h2.tagName === "H2") h2.style.display = "none";
            return;
        }

        contenedor.style.display = "";
        if (h2 && h2.tagName === "H2") h2.style.display = "";

        const cards = contenedor.querySelectorAll(".card");
        cards.forEach(card => {
            const textoCard = card.textContent.toLowerCase();
            card.style.display = textoCard.includes(texto) ? "" : "none";
        });
    });
}

// ===================
// MODAL
// ===================
function abrirModal(titulo, contenido, imagen) {
    document.getElementById("modal-titulo").textContent = titulo;
    document.getElementById("modal-contenido").innerHTML = contenido;

    const img = document.getElementById("modal-imagen");
    if (imagen) {
        img.src = imagen;
        img.alt = titulo;
        img.classList.remove("sin-imagen");
    } else {
        img.classList.add("sin-imagen");
    }

    document.getElementById("modal-overlay").classList.add("activo");
    document.body.style.overflow = "hidden";
}

function cerrarModal() {
    document.getElementById("modal-overlay").classList.remove("activo");
    document.body.style.overflow = "";
}

// ===============================
// GRAPHQL - TÉCNICAS MALDITAS
// ===============================
const queryTecnicas = `
{
  tecnicasMalditas {
    nodes {
      databaseId
      title
      tecnicaData {
        tipoDeTecnica
        usuario
        escuela
      }
    }
  }
}
`;

async function cargarTecnicas() {
    try {
        const response = await fetch(GRAPHQL_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: queryTecnicas })
        });
        const data = await response.json();
        mostrarTecnicas(data.data.tecnicasMalditas.nodes);
    } catch (error) {
        console.error("Error al cargar técnicas:", error);
    }
}

function mostrarTecnicas(tecnicas) {
    const contenedor = document.querySelector("#contenedor-tecnicas");
    if (!contenedor) return;

    contenedor.innerHTML = "";
    tecnicas.forEach(t => {
        const card = document.createElement("div");
        card.classList.add("card-tecnica");

        card.innerHTML = `
            <h3>${t.title}</h3>
            <p><strong>Usuario:</strong> ${t.tecnicaData.usuario}</p>
            <p><strong>Tipo:</strong> ${t.tecnicaData.tipoDeTecnica}</p>
            <p><strong>Escuela:</strong> ${t.tecnicaData.escuela}</p>
            <div class="d-flex gap-2 mt-2" style="padding: 0 1rem 1rem;">
                <button class="btn btn-warning btn-sm btn-editar"
                    data-id="${t.databaseId}"
                    data-titulo="${t.title}"
                    data-tipo="${t.tecnicaData.tipoDeTecnica}"
                    data-usuario="${t.tecnicaData.usuario}"
                    data-escuela="${t.tecnicaData.escuela}">
                    Editar
                </button>
                <button class="btn btn-danger btn-sm btn-eliminar"
                    data-id="${t.databaseId}">
                    Eliminar
                </button>
            </div>
        `;

        contenedor.appendChild(card);
    });

    $(".btn-editar").on("click", function() {
        $("#tecnica-id").val($(this).data("id"));
        $("#tecnica-titulo").val($(this).data("titulo"));
        $("#tecnica-tipo").val($(this).data("tipo"));
        $("#tecnica-usuario").val($(this).data("usuario"));
        $("#tecnica-escuela").val($(this).data("escuela"));
        $("#btn-guardar").text("Actualizar técnica");
        $("#btn-cancelar").show();
        document.querySelector("#formulario-tecnica").scrollIntoView({ behavior: "smooth" });
    });

    $(".btn-eliminar").on("click", function() {
        eliminarTecnica($(this).data("id"));
    });
}

// ==================================
// GRAPHQL - OBJETOS MALDITOS
// ==================================
const queryObjetos = `
{
  objetosMalditos {
    nodes {
      title
      objetoData {
        usuario
        nivelDePeligro
        descripcion
      }
    }
  }
}
`;

async function cargarObjetosMalditos() {
    try {
        const response = await fetch(GRAPHQL_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: queryObjetos })
        });
        const data = await response.json();
        mostrarObjetos(data.data.objetosMalditos.nodes);
    } catch (error) {
        console.error("Error al cargar objetos malditos:", error);
    }
}

function mostrarObjetos(objetos) {
    const contenedor = document.querySelector("#contenedor-objetos");
    if (!contenedor) return;

    contenedor.innerHTML = "";
    objetos.forEach(obj => {
        const card = document.createElement("div");
        card.classList.add("card-objeto");

        card.innerHTML = `
            <h3>${obj.title}</h3>
            <p><strong>Usuario:</strong> ${obj.objetoData.usuario}</p>
            <p><strong>Nivel de peligro:</strong> ${obj.objetoData.nivelDePeligro}</p>
            <p><strong>Descripción:</strong> ${obj.objetoData.descripcion}</p>
        `;

        contenedor.appendChild(card);
    });
}

// ==============================
// JQUERY - Bienvenida + CRUD
// ==============================
$(document).ready(function() {

    Swal.fire({
        title: "¡Bienvenidos a JJK con Jocy!",
        text: "El mundo de Jujutsu Kaisen te espera.",
        imageUrl: "https://jocaravena.laboratoriodiseno.cl/api-js/assets/img/Bienvenida.jpeg",
        imageWidth: 400,
        imageHeight: 220,
        imageAlt: "Jujutsu Kaisen",
        confirmButtonText: "¡Entrar!",
        confirmButtonColor: "#e63946"
    });

    $("#btn-guardar").on("click", function() {
        const id      = $("#tecnica-id").val();
        const titulo  = $("#tecnica-titulo").val().trim();
        const tipo    = $("#tecnica-tipo").val().trim();
        const usuario = $("#tecnica-usuario").val().trim();
        const escuela = $("#tecnica-escuela").val().trim();

        if (!titulo || !tipo || !usuario || !escuela) {
            Swal.fire("Campos vacíos", "Por favor completa todos los campos.", "warning");
            return;
        }

        if (id) {
            actualizarTecnica(id, titulo, tipo, usuario, escuela);
        } else {
            crearTecnica(titulo, tipo, usuario, escuela);
        }
    });

    $("#btn-cancelar").on("click", function() {
        limpiarFormulario();
    });

});

// --- CREAR ---
function crearTecnica(titulo, tipo, usuario, escuela) {
    const mutation = `
    mutation {
      createTecnicaMaldita(input: {
        title: "${titulo}",
        status: PUBLISH,
        tecnicaData: {
          tipoDeTecnica: "${tipo}",
          usuario: "${usuario}",
          escuela: "${escuela}"
        }
      }) {
        tecnicaMaldita {
          databaseId
          title
        }
      }
    }`;

    $.ajax({
        url: GRAPHQL_URL,
        method: "POST",
        contentType: "application/json",
        headers: { "Authorization": `Bearer ${JWT_TOKEN}` },
        data: JSON.stringify({ query: mutation }),
        success: function(respuesta) {
            if (respuesta.errors) {
                console.error("Error:", respuesta.errors);
                Swal.fire("Error", "No se pudo crear. Revisa la consola.", "error");
                return;
            }
            Swal.fire({
                icon: "success",
                title: "¡Técnica creada!",
                text: "La técnica maldita fue agregada correctamente.",
                confirmButtonColor: "#e63946"
            }).then(() => {
                limpiarFormulario();
                cargarTecnicas();
            });
        },
        error: function(err) {
            console.error("Error al crear:", err);
        }
    });
}

// --- ACTUALIZAR ---
function actualizarTecnica(id, titulo, tipo, usuario, escuela) {
    const mutation = `
    mutation {
      updateTecnicaMaldita(input: {
        id: "${id}",
        title: "${titulo}",
        tecnicaData: {
          tipoDeTecnica: "${tipo}",
          usuario: "${usuario}",
          escuela: "${escuela}"
        }
      }) {
        tecnicaMaldita {
          databaseId
          title
        }
      }
    }`;

    $.ajax({
        url: GRAPHQL_URL,
        method: "POST",
        contentType: "application/json",
        headers: { "Authorization": `Bearer ${JWT_TOKEN}` },
        data: JSON.stringify({ query: mutation }),
        success: function(respuesta) {
            if (respuesta.errors) {
                console.error("Error:", respuesta.errors);
                Swal.fire("Error", "No se pudo actualizar. Revisa la consola.", "error");
                return;
            }
            Swal.fire({
                icon: "success",
                title: "¡Técnica actualizada!",
                text: "Los cambios fueron guardados correctamente.",
                confirmButtonColor: "#e63946"
            }).then(() => {
                limpiarFormulario();
                cargarTecnicas();
            });
        },
        error: function(err) {
            console.error("Error al actualizar:", err);
        }
    });
}

// --- ELIMINAR ---
function eliminarTecnica(id) {
    Swal.fire({
        title: "¿Eliminar técnica?",
        text: "Esta acción no se puede deshacer.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#e63946",
        cancelButtonColor: "#444",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
    }).then((result) => {
        if (!result.isConfirmed) return;

        const mutation = `
        mutation {
          deleteTecnicaMaldita(input: { id: "${id}" }) {
            deletedId
          }
        }`;

        $.ajax({
            url: GRAPHQL_URL,
            method: "POST",
            contentType: "application/json",
            headers: { "Authorization": `Bearer ${JWT_TOKEN}` },
            data: JSON.stringify({ query: mutation }),
            success: function(respuesta) {
                if (respuesta.errors) {
                    Swal.fire("Error", "No se pudo eliminar.", "error");
                    return;
                }
                Swal.fire({
                    icon: "success",
                    title: "¡Eliminada!",
                    text: "La técnica fue eliminada.",
                    confirmButtonColor: "#e63946"
                }).then(() => cargarTecnicas());
            },
            error: function() {
                Swal.fire("Error", "No se pudo conectar.", "error");
            }
        });
    });
}

// --- LIMPIAR FORMULARIO ---
function limpiarFormulario() {
    $("#tecnica-id").val("");
    $("#tecnica-titulo").val("");
    $("#tecnica-tipo").val("");
    $("#tecnica-usuario").val("");
    $("#tecnica-escuela").val("");
    $("#btn-cancelar").hide();
    $("#btn-guardar").text("Guardar técnica");
}