document.addEventListener("DOMContentLoaded", () => {

    SwaggerUIBundle({
        url: "/api/docs",
        dom_id: "#swagger-ui",

        presets: [
            SwaggerUIBundle.presets.apis
        ],

        layout: "BaseLayout",

        requestInterceptor: (request) => {
            request.headers["Authorization"] = "Bearer SECRET";
            return request;
        }
    });

});
