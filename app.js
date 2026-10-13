
const $ = id => document.getElementById(id);

const samples = {
  safe: "Hey! Are we still meeting at the library at 4 pm today?",
  job: "Congratulations! You are selected for a work-from-home job earning ₹45,000 per week. Pay ₹1,500 registration fee today to confirm your offer. Send your Aadhaar and bank details on WhatsApp.",
  bank: "URGENT: Your bank account will be blocked today. Verify your account immediately at http://example.invalid/verify and share your OTP to avoid suspension."
};

const rules = [
  [
    "Urgency or pressure",
    18,
    /\b(urgent|immediately|act now|last chance|blocked today|right now|limited time|today only)\b/i,
    "The message pressures you to act quickly."
  ],
  [
    "Payment or upfront fee",
    35,
    /\b(registration fee|processing fee|upfront fee|joining fee|interview fee|application fee|security deposit|deposit fee|pay a fee|send money|payment required|pay ₹?\s?\d+|pay rs\.?\s?\d+)\b/i,
    "The message appears to request payment. Verify independently before paying."
  ],
  [
    "Sensitive information",
    28,
    /\b(otp|one.time password|pin|password|cvv|aadhaar|aadhar|bank details|account number|debit card|credit card)\b/i,
    "Sensitive identity or banking details may be involved."
  ],
  [
    "Suspicious link",
    12,
    /(https?:\/\/|www\.)/i,
    "A link is present. Check the domain carefully before opening it."
  ],
  [
    "Unrealistic job or reward",
    22,
    /\b(you (have )?won|claim your prize|guaranteed returns|selected for a job|earn ₹?\s?[\d,]+.*per week|work.from.home|guaranteed job|job guaranteed|no experience required.*high salary|easy money)\b/i,
    "An unusually attractive job or reward may be used as bait."
  ],
  [
    "Impersonation or threat",
    18,
    /\b(verify your account|account will be blocked|police case|arrest warrant|government refund|account suspended|legal action)\b/i,
    "The wording may imitate an institution or threaten consequences."
  ],
  [
    "Move off-platform",
    10,
    /\b(whatsapp|telegram|personal number)\b/i,
    "The message suggests private contact. Verify the sender independently."
  ]
];

document.querySelectorAll("[data-sample]").forEach(button => {
  button.onclick = () => {
    $("msg").value = samples[button.dataset.sample];
    updateCount();
  };
});

function updateCount() {
  $("count").textContent = $("msg").value.length + " / 10000";
}

$("msg").addEventListener("input", updateCount);

$("scan").onclick = () => {
  const message = $("msg").value.trim();

  if (!message) {
    $("msg").focus();
    $("msg").placeholder = "Paste a message or choose a sample first.";
    return;
  }

  const found = rules.filter(rule => rule[2].test(message));

  let score = Math.min(
    100,
    found.reduce((total, rule) => total + rule[1], 0)
  );

  const jobContext =
    /\b(job|hiring|recruitment|interview|joining|placement|employment|work.from.home|vacancy|career)\b/i.test(message);

  const feeContext =
    /\b(registration fee|processing fee|upfront fee|joining fee|interview fee|application fee|security deposit|deposit fee|pay a fee|send money|payment required|pay ₹?\s?[\d,]+|pay rs\.?\s?[\d,]+)\b/i.test(message);

  // Raise the risk score when a job-related message requests money.
  if (jobContext && feeContext) {
    score = Math.max(score, 65);
  }

  const level =
    score >= 60 ? "HIGH RISK" :
    score >= 30 ? "MEDIUM RISK" :
    "LOW INDICATED RISK";

  $("score").textContent = score;
  $("level").textContent = level;

  $("level").style.color =
    score >= 60 ? "var(--red)" :
    score >= 30 ? "var(--amber)" :
    "var(--mint)";

  $("summary").textContent = found.length
    ? found.length + " warning pattern(s) matched. Review the signals below."
    : "No listed patterns matched. This does not confirm that the message is safe.";

  $("findings").innerHTML = found.length
    ? found.map(rule =>
        "<li><b>" + rule[0] + ":</b> " + rule[3] + "</li>"
      ).join("")
    : "<li>No common warning patterns detected. Stay cautious with unexpected requests.</li>";

  if (jobContext && feeContext) {
    $("advice").textContent =
      "HIGH CAUTION: This job-related message requests money. Do not pay before independently verifying the employer through official contact details.";
  } else if (found.some(rule => rule[0] === "Sensitive information")) {
    $("advice").textContent =
      "Do not share OTPs, PINs, passwords, or banking details. Contact the institution through its official app or website.";
  } else if (found.some(rule => rule[0] === "Payment or upfront fee")) {
    $("advice").textContent =
      "Do not pay yet. Verify the organization and any fee using independently found official contact details.";
  } else {
    $("advice").textContent =
      "Pause before acting. Verify the sender independently and avoid suspicious links.";
  }

  $("result").classList.remove("hidden");
  $("result").scrollIntoView({ behavior: "smooth" });
};

updateCount();
