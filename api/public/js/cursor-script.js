const cursor = document.querySelector('.cursor');

        document.addEventListener('mousemove', e => {
            cursor.setAttribute("style", "top: "+(e.clientY - 70)+"px; left: "+(e.clientX - 70)+"px;")
        })

        document.addEventListener('click', () => {
            cursor.classList.add("expand");

            setTimeout(() => {
                cursor.classList.remove("expand");
            }, 500)
        })