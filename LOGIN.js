        lucide.createIcons();

        // --- 3. Configuration ---
        // REPLACE THIS WITH YOUR ACTUAL GOOGLE CLIENT ID FROM GOOGLE CLOUD CONSOLE
        const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com';
        
        let isOrg = false;
        let tokenClient;

        // --- 4. Google Auth Logic ---
        
        // Initialize the Token Client when the library loads
        window.onload = function() {
            // Check if Google Library is loaded
            if(window.google) {
                tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
                    callback: async (tokenResponse) => {
                        if (tokenResponse && tokenResponse.access_token) {
                            await fetchUserProfile(tokenResponse.access_token);
                        }
                    },
                });
            }
        };

        function handleGoogleLogin() {
            if (!tokenClient) {
                alert("Google Sign-In service is initializing or Client ID is missing. Please refresh or check console.");
                return;
            }
            // Triggers the Google Popup
            tokenClient.requestAccessToken();
        }

        async function fetchUserProfile(accessToken) {
            const btnText = document.getElementById('googleBtnText');
            btnText.innerText = "Verifying...";
            
            try {
                // Fetch user data using the token
                const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
                
                const data = await response.json();
                console.log("User Data:", data);

                // Simulate Login Logic
                alert(`Hello, ${data.name}! Login Successful.`);
                
                // Redirect logic
                window.location.href = 'dashboard.html';

            } catch (error) {
                console.error("Error fetching user data:", error);
                btnText.innerText = "Sign in with Google";
                alert("Failed to sign in. Please try again.");
            }
        }

        // --- Existing UI Logic ---

        function toggleUserType() {
            isOrg = !isOrg;
            const slider = document.getElementById('slider');
            const studentLabel = document.getElementById('studentLabel');
            const orgLabel = document.getElementById('orgLabel');

            if (isOrg) {
                slider.style.left = '50%';
                orgLabel.classList.add('active-text');
                studentLabel.classList.remove('active-text');
            } else {
                slider.style.left = '0';
                studentLabel.classList.add('active-text');
                orgLabel.classList.remove('active-text');
            }
        }

        function handleLogin(e) {
            e.preventDefault();
            const type = isOrg ? "Organisation" : "Student";
            const btn = e.target.querySelector('button');
            const originalText = btn.innerHTML;
            
            btn.innerHTML = 'Verifying...';
            btn.style.opacity = '0.7';
            
            setTimeout(() => {
                alert(`Welcome back! You are entering as a ${type}.`);
                btn.innerHTML = originalText;
                btn.style.opacity = '1';
                window.location.href = 'dashboard.html';
            }, 1000);
        }
