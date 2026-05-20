document.addEventListener("DOMContentLoaded", () => {

    const pendulumCanvas = document.getElementById("homePendulumPreview");
    const ballBeamCanvas = document.getElementById("homeBallBeamPreview");

    if (pendulumCanvas) {
        drawPendulumPreview(pendulumCanvas);
    }

    if (ballBeamCanvas) {
        drawBallBeamPreview(ballBeamCanvas);
    }

    function drawPendulumPreview(canvas) {

        const ctx = canvas.getContext("2d");
        const width = canvas.width;
        const height = canvas.height;

        drawPreviewBackground(ctx, width, height);

        const groundY = 152;
        const wheelRadius = 10;
        const cartX = width / 2;
        const cartY = groundY - 44;
        const cartWidth = 78;
        const cartHeight = 34;
        const pivotY = cartY - 2;
        const rodLength = 76;
        const angle = -0.08;

        ctx.save();
        ctx.strokeStyle = "#81A6C6";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(42, groundY);
        ctx.lineTo(width - 42, groundY);
        ctx.stroke();

        ctx.restore();

        roundRect(ctx, cartX - cartWidth / 2, cartY, cartWidth, cartHeight, 10);
        ctx.fillStyle = "rgba(170,205,220,0.78)";
        ctx.fill();
        ctx.strokeStyle = "#6f95b8";
        ctx.lineWidth = 4;
        ctx.stroke();

        drawWheel(ctx, cartX - 28, groundY, wheelRadius);
        drawWheel(ctx, cartX + 28, groundY, wheelRadius);

        const bobX = cartX + Math.sin(angle) * rodLength;
        const bobY = pivotY - Math.cos(angle) * rodLength;

        ctx.save();
        ctx.strokeStyle = "#c4b7a5";
        ctx.lineWidth = 7;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(cartX, pivotY);
        ctx.lineTo(bobX, bobY);
        ctx.stroke();

        ctx.fillStyle = "#81A6C6";
        ctx.beginPath();
        ctx.arc(cartX, pivotY, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        drawBall(ctx, bobX, bobY, 21);
    }

    function drawBallBeamPreview(canvas) {

        const ctx = canvas.getContext("2d");
        const width = canvas.width;
        const height = canvas.height;

        drawPreviewBackground(ctx, width, height);

        const centerX = width / 2;
        const centerY = 90;
        const beamLength = 235;
        const angle = -0.08;
        const half = beamLength / 2;

        const leftX = centerX - Math.cos(angle) * half;
        const leftY = centerY - Math.sin(angle) * half;
        const rightX = centerX + Math.cos(angle) * half;
        const rightY = centerY + Math.sin(angle) * half;

        ctx.save();
        ctx.fillStyle = "rgba(210,196,180,0.72)";
        ctx.beginPath();
        ctx.moveTo(centerX, centerY + 12);
        ctx.lineTo(centerX - 30, height - 38);
        ctx.lineTo(centerX + 30, height - 38);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = "#b7a796";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.strokeStyle = "#81A6C6";
        ctx.lineWidth = 12;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(leftX, leftY);
        ctx.lineTo(rightX, rightY);
        ctx.stroke();

        ctx.strokeStyle = "rgba(47,47,47,0.12)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(leftX, leftY + 14);
        ctx.lineTo(rightX, rightY + 14);
        ctx.stroke();

        ctx.fillStyle = "#81A6C6";
        ctx.beginPath();
        ctx.arc(centerX, centerY, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        const ballOffset = 36;
        const ballX = centerX + Math.cos(angle) * ballOffset;
        const ballY = centerY + Math.sin(angle) * ballOffset - 26;

        drawBall(ctx, ballX, ballY, 23);
    }

    function drawPreviewBackground(ctx, width, height) {

        ctx.clearRect(0, 0, width, height);

        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, "rgba(129,166,198,0.10)");
        gradient.addColorStop(1, "rgba(243,227,208,0.14)");

        ctx.fillStyle = gradient;
        roundRect(ctx, 0, 0, width, height, 18);
        ctx.fill();

        ctx.strokeStyle = "rgba(129,166,198,0.10)";
        ctx.lineWidth = 1;

        for (let x = 24; x < width; x += 32) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        for (let y = 22; y < height; y += 30) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }

    function drawWheel(ctx, x, y, radius) {

        ctx.save();
        ctx.fillStyle = "#2f2f2f";
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function drawBall(ctx, x, y, radius) {

        ctx.save();

        const gradient = ctx.createRadialGradient(
            x - radius * 0.35,
            y - radius * 0.42,
            radius * 0.16,
            x,
            y,
            radius
        );

        gradient.addColorStop(0, "#ffffff");
        gradient.addColorStop(0.42, "#F3E3D0");
        gradient.addColorStop(1, "#D2C4B4");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#b7a796";
        ctx.lineWidth = 5;
        ctx.stroke();

        ctx.restore();
    }

    function roundRect(ctx, x, y, width, height, radius) {

        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

});
