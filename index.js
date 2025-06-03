// Store our API keys and endpoint for Adzuna
        const API_CONFIG = {
            adzuna: {
                appId: 'c627a7b9', // Replace with your valid Adzuna app ID
                appKey: 'b58224073ccc0d1d53f1b0c66138d979', // Replace with your valid Adzuna app key
                endpoint: 'https://api.adzuna.com/v1/api/jobs/us/search'
            }
        };

        // Arrays to store job data
        let jobs = [];

        // Get DOM elements
        const searchForm = document.getElementById('searchForm');
        const jobsSection = document.getElementById('jobsSection');
        const loadingSection = document.getElementById('loadingSection');
        const errorSection = document.getElementById('errorSection');
        const jobTitleInput = document.getElementById('jobTitle');
        const locationInput = document.getElementById('location');

        // When the page loads, fetch some default jobs
        document.addEventListener('DOMContentLoaded', function() {
            searchJobs('software engineer', 'New York');
        });

        // Handle form submission when user clicks "Search Jobs"
        searchForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Prevent page reload
            const jobTitle = jobTitleInput.value.trim();
            const location = locationInput.value.trim() || 'New York'; // Default to New York if empty

            // Check if job title is provided
            if (!jobTitle) {
                showError('Please enter a job title.');
                return;
            }

            searchJobs(jobTitle, location);
        });

        // Function to search for jobs
        async function searchJobs(jobTitle, location) {
            showLoading(); // Show loading spinner

            try {
                jobs = await fetchJobs(jobTitle, location); // Fetch jobs from API
                hideLoading(); // Hide loading spinner
                displayJobs(jobs); // Show jobs on page
            } catch (error) {
                hideLoading();
                showError(`Error fetching jobs: ${error.message}`);
                console.error('Error:', error);
            }
        }

        // Function to fetch jobs from Adzuna API
        async function fetchJobs(jobTitle, location) {
            const config = API_CONFIG.adzuna;
            const url = `${config.endpoint}/1?app_id=${config.appId}&app_key=${config.appKey}&what=${encodeURIComponent(jobTitle)}&where=${encodeURIComponent(location)}&results_per_page=20`;

            try {
                const response = await fetch(url, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });

                // Check if the API request was successful
                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error('Invalid API keys. Please get valid keys from Adzuna.');
                    } else if (response.status === 429) {
                        throw new Error('Too many requests. Try again later.');
                    } else {
                        throw new Error(`API error: ${response.status}`);
                    }
                }

                const data = await response.json();
                console.log('API Response:', data); // Log response to help debug

                // Check if we got any job results
                if (!data.results || !Array.isArray(data.results)) {
                    return [];
                }

                // Convert API data to our job format
                return data.results.map((job, index) => ({
                    id: job.id || `job-${index}`,
                    title: job.title || 'No Title',
                    company: job.company?.display_name || 'Unknown Company',
                    location: job.location?.display_name || 'Unknown Location',
                    type: job.contract_type || 'Full-time',
                    salary: job.salary_min && job.salary_max ? 
                        `${formatSalary(job.salary_min)} - ${formatSalary(job.salary_max)}` : 'Not Listed',
                    description: shortenDescription(job.description || 'No description available', 200),
                    postedDate: job.created || new Date().toISOString(),
                    url: job.redirect_url || '#',
                    remote: job.description?.toLowerCase().includes('remote') || false
                }));
            } catch (error) {
                console.error('Fetch Error:', error);
                throw error;
            }
        }

        // Show loading spinner
        function showLoading() {
            loadingSection.style.display = 'block';
            jobsSection.style.display = 'none';
            errorSection.style.display = 'none';
        }

        // Hide loading spinner
        function hideLoading() {
            loadingSection.style.display = 'none';
            jobsSection.style.display = 'grid';
        }

        // Show error message
        function showError(message) {
            errorSection.textContent = message;
            errorSection.style.display = 'block';
            jobsSection.style.display = 'none';
        }

        // Display jobs on the page
        function displayJobs(jobs) {
            if (jobs.length === 0) {
                jobsSection.innerHTML = `
                    <div class="no-jobs">
                        <h3>No jobs found</h3>
                        <p>Try a different job title or location.</p>
                    </div>
                `;
                return;
            }

            jobsSection.innerHTML = jobs.map(job => `
                <div class="job-card">
                    <h3 class="job-title">${cleanText(job.title)}</h3>
                    <div class="job-company">${cleanText(job.company)}</div>
                    <div class="job-details">
                        <span class="job-tag">📍 ${cleanText(job.location)}</span>
                        <span class="job-tag">💼 ${cleanText(job.type)}</span>
                        <span class="job-tag">💰 ${cleanText(job.salary)}</span>
                        ${job.remote ? '<span class="job-tag">🏠 Remote</span>' : ''}
                    </div>
                    <p class="job-description">${cleanText(job.description)}</p>
                    <div class="job-footer">
                        <span class="job-date">Posted: ${formatDate(job.postedDate)}</span>
                        <a href="${job.url}" class="apply-btn" target="_blank">Apply Now</a>
                    </div>
                </div>
            `).join('');
        }

        // Format date to look nice (e.g., "Jan 1, 2025")
        function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        }

        // Clean text to prevent security issues
        function cleanText(text) {
            const div = document.createElement('div');
            div.textContent = text || '';
            return div.innerHTML;
        }

        // Shorten job description to fit in card
        function shortenDescription(description, maxLength) {
            const clean = description.replace(/<[^>]*>/g, ''); // Remove HTML tags
            if (clean.length <= maxLength) return clean;
            return clean.substring(0, maxLength) + '...';
        }

        // Format salary (e.g., 50000 -> 50k)
        function formatSalary(salary) {
            if (!salary) return 'N/A';
            if (salary >= 1000000) return (salary / 1000000).toFixed(1) + 'M';
            if (salary >= 1000) return (salary / 1000).toFixed(0) + 'k';
            return salary.toString();
        }