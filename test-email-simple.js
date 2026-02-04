
const { Resend } = require('resend');

const key = "re_eWh22GgD_8foA3SVQDwaDusySQRRH1z46";
console.log("Testing Resend with Key:", key.slice(0, 5) + "...");

async function testConfig() {
    const resend = new Resend(key);

    try {
        const { data, error } = await resend.emails.send({
            from: "Slict Auto <onboarding@resend.dev>",
            to: ["team@slict.lk"], // Using the email from the user's screenshot context
            subject: "Test Email from Script",
            html: "<p>If you get this, Resend is working!</p>"
        });

        if (error) {
            console.error("❌ Resend Error:", JSON.stringify(error, null, 2));
        } else {
            console.log("✅ Success! ID:", data.id);
        }
    } catch (e) {
        console.error("❌ Exception:", e);
    }
}

testConfig();
