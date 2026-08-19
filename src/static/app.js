document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Helper to get initials from an email (shared)
  function getInitials(email) {
    try {
      const namePart = email.split("@")[0];
      const parts = namePart.split(/[._\-]/).filter(Boolean);
      if (parts.length === 0) return email.slice(0, 2).toUpperCase();
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[1][0]).toUpperCase();
    } catch (e) {
      return email.slice(0, 2).toUpperCase();
    }
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";


      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        activityCard.dataset.activity = name;

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML
        const participants = details.participants || [];
        let participantsHtml = `<div class="activity-participants"><strong>Participants</strong>`;
        if (participants.length === 0) {
          participantsHtml += `<p class="no-participants">No participants yet</p>`;
        } else {
          participantsHtml += `<ul class="participants-list">`;
          participants.forEach((email) => {
            const initials = getInitials(email);
            participantsHtml += `\n              <li class="participant" data-email="${email}">\n                <span class="avatar">${initials}</span>\n                <span class="participant-email">${email}</span>\n                <button class="delete-btn" title="Remove participant" data-email="${email}">✕</button>\n              </li>`;
          });
          participantsHtml += `\n            </ul>`;
        }
        participantsHtml += `</div>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Update the activity card immediately so the user sees the change
        try {
          addParticipantToCard(activity, email);
        } catch (e) {
          // fallback: refresh full list if something goes wrong
          fetchActivities();
        }
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();

  // Add a participant row to the DOM for a given activity (optimistic update)
  function addParticipantToCard(activityName, email) {
    const cards = Array.from(activitiesList.querySelectorAll('.activity-card'));
    const card = cards.find((c) => c.dataset.activity === activityName);
    if (!card) return;

    const participantsContainer = card.querySelector('.activity-participants');
    let list = participantsContainer && participantsContainer.querySelector('.participants-list');

    // If no participants section yet, create it
    if (!participantsContainer) {
      const container = document.createElement('div');
      container.className = 'activity-participants';
      container.innerHTML = `<strong>Participants</strong>`;
      card.appendChild(container);
    }

    const container = card.querySelector('.activity-participants');

    // Remove 'no participants' placeholder if present
    const noPart = container.querySelector('.no-participants');
    if (noPart) noPart.remove();

    if (!list) {
      list = document.createElement('ul');
      list.className = 'participants-list';
      container.appendChild(list);
    }

    // Create participant row
    const li = document.createElement('li');
    li.className = 'participant';
    li.dataset.email = email;

    const initials = getInitials(email);
    li.innerHTML = `
      <span class="avatar">${initials}</span>
      <span class="participant-email">${email}</span>
      <button class="delete-btn" title="Remove participant" data-email="${email}">✕</button>
    `;

    list.appendChild(li);

    // Update availability text (decrement shown spots)
    const pTags = Array.from(card.querySelectorAll('p'));
    const avail = pTags.find(p => p.textContent && p.textContent.includes('spots left'));
    if (avail) {
      const match = avail.textContent.match(/(\d+) spots left/);
      if (match) {
        const current = parseInt(match[1], 10);
        const next = Math.max(0, current - 1);
        avail.innerHTML = `<strong>Availability:</strong> ${next} spots left`;
      }
    }
  }

  // Handle participant delete (event delegation)
  activitiesList.addEventListener("click", async (event) => {
    const btn = event.target.closest(".delete-btn");
    if (!btn) return;

    const activityCard = btn.closest(".activity-card");
    const activityName = activityCard && activityCard.dataset.activity;
    const email = btn.dataset.email;

    if (!activityName || !email) return;

    if (!confirm(`Remove ${email} from ${activityName}?`)) return;

    try {
      const res = await fetch(
        `/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        // Refresh the activities list to reflect the change
        fetchActivities();
      } else {
        const result = await res.json();
        alert(result.detail || "Failed to remove participant");
      }
    } catch (err) {
      console.error(err);
      alert("Error removing participant");
    }
  });
});
