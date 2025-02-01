const menu = document.querySelector("#menu");
const nav = document.querySelector(".links");

menu.onclick = () => {
    menu.classList.toggle('bx-x');
    nav.classList.toggle('active');
}
// Initialize EmailJS with your public key
document.addEventListener("DOMContentLoaded", function () {
    emailjs.init("bDqysbVP5iSiWQlx9"); // Replace with your EmailJS Public Key
});

// Add event listener to the form
document.getElementById("contact-form").addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent the default form submission

    // Get form values
    const fullName = document.getElementById("full-name").value;
    const email = document.getElementById("email").value;
    const message = document.getElementById("message").value;

    // Send email using EmailJS
    emailjs.send("service_7vsrvgo", "template_wimmpve", {
    user_name: "Deejay", // Recipient's name (can be dynamic if needed)
    from_name: fullName, // Name inputted in the form
    from_email: email, // Email inputted in the form
    message: message // Message inputted in the form
}).then(function (response) {
    console.log("Email sent successfully:", response);

    // Show success message
    alert("Message Success!");

    // Clear the form
    document.getElementById("contact-form").reset();
}, function (error) {
    console.error("Email failed to send:", error);

    // Show error message
    alert("Failed to send message. Please try again.");
});
});