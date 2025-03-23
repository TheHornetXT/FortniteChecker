document.addEventListener('DOMContentLoaded', function() {
    const usernameInput = document.getElementById('username');
    const searchBtn = document.getElementById('search-btn');
    const loader = document.getElementById('loader');
    const errorMessage = document.getElementById('error-message');
    const results = document.getElementById('results');
    
    // API Keys
    const lookupApiKey = "38d7693a-61175dd9-b24ece76-0fca69a9";
    const statsApiKey = "928f6894-a9aa-4dac-9790-071f2de552f7";
    
    // Tab functionality
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to current button and content
            button.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
    
    searchBtn.addEventListener('click', () => {
        fetchFortniteStats();
    });
    
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            fetchFortniteStats();
        }
    });
    
    async function fetchFortniteStats() {
        const username = usernameInput.value.trim();
        if (!username) {
            showError("Please enter a Fortnite username");
            return;
        }
        
        // Reset and show loader
        resetUI();
        loader.style.display = 'flex';
        
        const lookupUrl = `https://fortniteapi.io/v2/lookup?username=${encodeURIComponent(username)}&platform=epic`;
        
        try {
            // Step 1: Look up the account ID
            const lookupResponse = await fetch(lookupUrl, {
                headers: {
                    "Authorization": lookupApiKey,
                    "Accept": "application/json"
                }
            });
            
            if (!lookupResponse.ok) {
                throw new Error(`Lookup error! Status: ${lookupResponse.status}`);
            }
            
            const lookupData = await lookupResponse.json();
            if (!lookupData.account_id) {
                throw new Error("Account ID not found!");
            }
            
            const accountId = lookupData.account_id;
            console.log("Account ID:", accountId);
            
            // Update account ID in UI
            document.getElementById('account-id').textContent = `Account ID: ${accountId}`;
            document.getElementById('display-name').textContent = lookupData.displayName || username;
            
            // Step 2: Fetch the stats using the account ID
            const statsUrl = `https://fortnite-api.com/v2/stats/br/v2/${accountId}`;
            
            const statsResponse = await fetch(statsUrl, {
                headers: {
                    "Authorization": statsApiKey,
                    "Accept": "application/json"
                }
            });
            
            if (!statsResponse.ok) {
                throw new Error(`Stats error! Status: ${statsResponse.status}`);
            }
            
            const statsData = await statsResponse.json();
            console.log("Fortnite Stats:", statsData);
            
            // Process and display stats
            displayStats(statsData.data);
            
            // Hide loader and show results
            loader.style.display = 'none';
            results.style.display = 'block';
            
        } catch (error) {
            console.error("Error fetching data:", error);
            showError(error.message || "Error fetching Fortnite data. Please try again.");
            loader.style.display = 'none';
        }
    }
    
    function displayStats(data) {
        if (!data) {
            showError("No stats data available for this player.");
            return;
        }
        
        // Account Overview
        displayAccountInfo(data);
        
        // Display stats for each mode
        const modes = ['overall', 'solo', 'duo', 'squad', 'ltm'];
        const statCategories = ['performance', 'combat', 'survival', 'matches'];
        
        modes.forEach(mode => {
            let modeData;
            
            if (mode === 'overall') {
                modeData = data.stats.all.overall;
            } else if (mode === 'ltm') {
                modeData = data.stats.all.ltm;
            } else {
                modeData = data.stats.all[mode];
            }
            
            if (!modeData) {
                statCategories.forEach(category => {
                    const sectionId = `${mode}-${category}`;
                    const section = document.getElementById(sectionId);
                    section.innerHTML = '<p class="no-stats">No data available</p>';
                });
                return;
            }
            
            // Performance stats
            populatePerformanceStats(`${mode}-performance`, modeData);
            
            // Combat stats
            populateCombatStats(`${mode}-combat`, modeData);
            
            // Survival stats
            populateSurvivalStats(`${mode}-survival`, modeData);
            
            // Match history stats
            populateMatchStats(`${mode}-matches`, modeData);
        });
        
        // Display competitive data if available
        if (data.stats.all.competitive) {
            populateCompetitiveStats(data.stats.all.competitive);
        } else {
            // Hide competitive section if no data
            document.getElementById('competitive-container').style.display = 'none';
        }
        
        // Display current and previous season data
        if (data.stats.all.season) {
            populateSeasonStats('current-season', data.stats.all.season.current);
            populateSeasonStats('previous-season', data.stats.all.season.previous);
        }
        
        // Weapon stats (if available)
        if (data.stats.all.weapons) {
            populateWeaponStats(data.stats.all.weapons);
        } else {
            // Hide weapons section if no data
            document.getElementById('weapons-container').style.display = 'none';
        }
        
        // Recent match data
        if (data.stats.all.lastMatch) {
            populateLastMatchStats(data.stats.all.lastMatch);
        }
    }
    
    function displayAccountInfo(data) {
        // Set account level
        if (data.account && data.account.level) {
            document.getElementById('level-value').textContent = data.account.level;
        }
        
        // Set battle pass progress
        if (data.battlePass) {
            const progressElement = document.getElementById('battle-pass-progress');
            const levelElement = document.getElementById('battle-pass-level');
            
            levelElement.textContent = data.battlePass.level || 0;
            
            if (data.battlePass.progress) {
                progressElement.style.width = `${data.battlePass.progress}%`;
            }
        }
    }
    
    function populatePerformanceStats(sectionId, stats) {
        const section = document.getElementById(sectionId);
        section.innerHTML = '';
        
        if (!stats) {
            section.innerHTML = '<p class="no-stats">No performance data available</p>';
            return;
        }
        
        // Performance stats
        const performanceStats = [
            { key: 'score', label: 'Total Score', highlight: true },
            { key: 'scorePerMin', label: 'Score Per Minute', highlight: true },
            { key: 'scorePerMatch', label: 'Score Per Match', highlight: true },
            { key: 'wins', label: 'Total Wins', highlight: true },
            { key: 'winRate', label: 'Win Rate %', highlight: true },
            { key: 'top3', label: 'Top 3 Finishes' },
            { key: 'top5', label: 'Top 5 Finishes' },
            { key: 'top6', label: 'Top 6 Finishes' },
            { key: 'top10', label: 'Top 10 Finishes' },
            { key: 'top12', label: 'Top 12 Finishes' },
            { key: 'top25', label: 'Top 25 Finishes' }
        ];
        
        createStatItems(section, stats, performanceStats);
    }
    
    function populateCombatStats(sectionId, stats) {
        const section = document.getElementById(sectionId);
        section.innerHTML = '';
        
        if (!stats) {
            section.innerHTML = '<p class="no-stats">No combat data available</p>';
            return;
        }
        
        // Combat stats
        const combatStats = [
            { key: 'kills', label: 'Total Kills', highlight: true },
            { key: 'killsPerMin', label: 'Kills Per Minute', highlight: true },
            { key: 'killsPerMatch', label: 'Kills Per Match', highlight: true },
            { key: 'deaths', label: 'Total Deaths' },
            { key: 'kd', label: 'K/D Ratio', highlight: true },
            { key: 'assists', label: 'Total Assists' },
            { key: 'headshots', label: 'Headshot Kills' },
            { key: 'headshotPercentage', label: 'Headshot %' },
            { key: 'damageTaken', label: 'Damage Taken' },
            { key: 'damageDealt', label: 'Damage Dealt' },
            { key: 'damagePerMatch', label: 'Damage Per Match' },
            { key: 'damagePerMin', label: 'Damage Per Minute' }
        ];
        
        createStatItems(section, stats, combatStats);
    }
    
    function populateSurvivalStats(sectionId, stats) {
        const section = document.getElementById(sectionId);
        section.innerHTML = '';
        
        if (!stats) {
            section.innerHTML = '<p class="no-stats">No survival data available</p>';
            return;
        }
        
        // Survival stats
        const survivalStats = [
            { key: 'minutesPlayed', label: 'Minutes Played', format: 'time' },
            { key: 'hoursPlayed', label: 'Hours Played', format: 'time' },
            { key: 'avgTimePerMatch', label: 'Avg Time Per Match', format: 'time' },
            { key: 'playersOutlived', label: 'Players Outlived', highlight: true },
            { key: 'avgPlayersOutlived', label: 'Avg Players Outlived Per Match' },
            { key: 'revives', label: 'Total Revives' },
            { key: 'daysPlayed', label: 'Days Played' },
            { key: 'lastModified', label: 'Last Played', format: 'date' }
        ];
        
        createStatItems(section, stats, survivalStats);
    }
    
    function populateMatchStats(sectionId, stats) {
        const section = document.getElementById(sectionId);
        section.innerHTML = '';
        
        if (!stats) {
            section.innerHTML = '<p class="no-stats">No match data available</p>';
            return;
        }
        
        // Match history stats
        const matchStats = [
            { key: 'matches', label: 'Total Matches', highlight: true },
            { key: 'matchesPlayed', label: 'Matches Played' },
            { key: 'startCount', label: 'Match Starts' },
            { key: 'avgPlacement', label: 'Average Placement' },
            { key: 'timesLanded', label: 'Times Landed' },
            { key: 'firstMatch', label: 'First Match', format: 'date' },
            { key: 'lastWin', label: 'Last Win', format: 'date' }
        ];
        
        createStatItems(section, stats, matchStats);
    }
    
    function populateCompetitiveStats(competitiveData) {
        if (!competitiveData) return;
        
        // Arena stats
        const arenaSection = document.getElementById('arena-stats');
        arenaSection.innerHTML = '';
        
        const arenaStats = [
            { key: 'points', label: 'Arena Points', highlight: true },
            { key: 'division', label: 'Current Division', highlight: true },
            { key: 'matches', label: 'Arena Matches' },
            { key: 'wins', label: 'Arena Wins' },
            { key: 'winRate', label: 'Arena Win Rate %' },
            { key: 'kills', label: 'Arena Kills' },
            { key: 'kd', label: 'Arena K/D Ratio' },
            { key: 'minutesPlayed', label: 'Arena Time Played', format: 'time' }
        ];
        
        createStatItems(arenaSection, competitiveData, arenaStats);
        
        // Tournament stats
        const tournamentSection = document.getElementById('tournament-stats');
        tournamentSection.innerHTML = '';
        
        if (competitiveData.tournaments) {
            const tournamentStats = [
                { key: 'participations', label: 'Tournaments Played' },
                { key: 'wins', label: 'Tournament Wins', highlight: true },
                { key: 'top10', label: 'Top 10 Finishes' },
                { key: 'top25', label: 'Top 25 Finishes' },
                { key: 'top50', label: 'Top 50 Finishes' },
                { key: 'top100', label: 'Top 100 Finishes' },
                { key: 'bestPlacement', label: 'Best Placement', highlight: true },
                { key: 'totalPoints', label: 'Total Tournament Points', highlight: true }
            ];
            
            createStatItems(tournamentSection, competitiveData.tournaments, tournamentStats);
        } else {
            tournamentSection.innerHTML = '<p class="no-stats">No tournament data available</p>';
        }
    }
    
    function populateSeasonStats(sectionId, seasonData) {
        const section = document.getElementById(sectionId);
        section.innerHTML = '';
        
        if (!seasonData) {
            section.innerHTML = '<p class="no-stats">No season data available</p>';
            return;
        }
        
        const seasonStats = [
            { key: 'level', label: 'Season Level', highlight: true },
            { key: 'progress', label: 'Level Progress %' },
            { key: 'totalXp', label: 'Total XP Earned' },
            { key: 'dailyXp', label: 'Daily XP' },
            { key: 'weeklyXp', label: 'Weekly XP' },
            { key: 'rewardsClaimed', label: 'Rewards Claimed' },
            { key: 'matches', label: 'Season Matches' },
            { key: 'wins', label: 'Season Wins', highlight: true },
            { key: 'winRate', label: 'Season Win Rate %' },
            { key: 'kills', label: 'Season Kills' },
            { key: 'kd', label: 'Season K/D Ratio' }
        ];
        
        createStatItems(section, seasonData, seasonStats);
    }
    
    function populateWeaponStats(weaponsData) {
        if (!weaponsData) return;
        
        // Weapon proficiency stats
        const weaponSection = document.getElementById('weapon-stats');
        weaponSection.innerHTML = '';
        
        const weaponStats = [
            { key: 'mostUsed', label: 'Most Used Weapon', highlight: true },
            { key: 'mostEffective', label: 'Most Effective Weapon', highlight: true },
            { key: 'rifleKills', label: 'Assault Rifle Kills' },
            { key: 'shotgunKills', label: 'Shotgun Kills' },
            { key: 'smgKills', label: 'SMG Kills' },
            { key: 'sniperKills', label: 'Sniper Kills' },
            { key: 'explosiveKills', label: 'Explosive Kills' },
            { key: 'pistolKills', label: 'Pistol Kills' },
            { key: 'meleeKills', label: 'Melee Kills' }
        ];
        
        createStatItems(weaponSection, weaponsData, weaponStats);
        
        // Building stats
        const buildingSection = document.getElementById('building-stats');
        buildingSection.innerHTML = '';
        
        if (weaponsData.building) {
            const buildingStats = [
                { key: 'materialsGathered', label: 'Materials Gathered' },
                { key: 'materialsUsed', label: 'Materials Used' },
                { key: 'structuresPlaced', label: 'Structures Placed' },
                { key: 'structuresDestroyed', label: 'Structures Destroyed' },
                { key: 'wallsPlaced', label: 'Walls Placed' },
                { key: 'floorsPlaced', label: 'Floors Placed' },
                { key: 'rampPlaced', label: 'Ramps Placed' },
                { key: 'buildingEdits', label: 'Building Edits' }
            ];
            
            createStatItems(buildingSection, weaponsData.building, buildingStats);
        } else {
            buildingSection.innerHTML = '<p class="no-stats">No building data available</p>';
        }
    }
    
    function populateLastMatchStats(lastMatchData) {
        if (!lastMatchData) return;
        
        const lastMatchSection = document.getElementById('last-match');
        lastMatchSection.innerHTML = '';
        
        const lastMatchStats = [
            { key: 'dateTime', label: 'Played On', format: 'date' },
            { key: 'gameMode', label: 'Game Mode' },
            { key: 'result', label: 'Match Result', highlight: true },
            { key: 'placement', label: 'Placement', highlight: true },
            { key: 'kills', label: 'Kills', highlight: true },
            { key: 'score', label: 'Score' },
            { key: 'playersOutlived', label: 'Players Outlived' },
            { key: 'minutesPlayed', label: 'Match Duration', format: 'time' }
        ];
        
        createStatItems(lastMatchSection, lastMatchData, lastMatchStats);
        
        // Recent achievements
        const achievementsSection = document.getElementById('recent-achievements');
        achievementsSection.innerHTML = '';
        
        if (lastMatchData.achievements) {
            const achievementsList = lastMatchData.achievements.map(achievement => {
                return { key: achievement.id, label: achievement.name, value: achievement.description, highlight: true };
            });
            
            createCustomStatItems(achievementsSection, achievementsList);
        } else {
            achievementsSection.innerHTML = '<p class="no-stats">No recent achievements</p>';
        }
    }
    
    function createStatItems(section, data, statsDefinition) {
        statsDefinition.forEach(stat => {
            if (data[stat.key] !== undefined) {
                const statItem = document.createElement('div');
                statItem.className = 'stat-item';
                
                const statLabel = document.createElement('div');
                statLabel.className = 'stat-label';
                statLabel.textContent = stat.label;
                
                const statValue = document.createElement('div');
                statValue.className = stat.highlight ? 'stat-value highlight' : 'stat-value';
                
                // Format value based on type
                let formattedValue;
                
                if (stat.format === 'time') {
                    formattedValue = formatTime(data[stat.key]);
                } else if (stat.format === 'date') {
                    formattedValue = formatDate(data[stat.key]);
                } else if (stat.key.includes('Rate') || stat.key.includes('Percentage')) {
                    formattedValue = parseFloat(data[stat.key]).toFixed(2) + '%';
                } else if (typeof data[stat.key] === 'number' && !Number.isInteger(data[stat.key])) {
                    formattedValue = parseFloat(data[stat.key]).toFixed(2);
                } else {
                    formattedValue = data[stat.key].toLocaleString();
                }
                
                statValue.textContent = formattedValue;
                
                // Add color class based on value for certain stats
                if (stat.key === 'kd' || stat.key === 'winRate') {
                    const value = parseFloat(data[stat.key]);
                    statValue.classList.add(getRatingClass(value, stat.key));
                }
                
                statItem.appendChild(statLabel);
                statItem.appendChild(statValue);
                section.appendChild(statItem);
            }
        });
        
        // If no stats were found, display message
        if (section.children.length === 0) {
            section.innerHTML = '<p class="no-stats">No data available</p>';
        }
    }
    
    function createCustomStatItems(section, customStats) {
        customStats.forEach(stat => {
            const statItem = document.createElement('div');
            statItem.className = 'stat-item';
            
            const statLabel = document.createElement('div');
            statLabel.className = 'stat-label';
            statLabel.textContent = stat.label;
            
            const statValue = document.createElement('div');
            statValue.className = stat.highlight ? 'stat-value highlight' : 'stat-value';
            statValue.textContent = stat.value || 'N/A';
            
            statItem.appendChild(statLabel);
            statItem.appendChild(statValue);
            section.appendChild(statItem);
        });
    }
    
    function formatTime(minutes) {
        if (!minutes) return 'N/A';
        
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = Math.floor(minutes % 60);
        
        if (hours > 0) {
            return `${hours}h ${remainingMinutes}m`;
        } else {
            return `${remainingMinutes}m`;
        }
    }
    
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleString();
        } catch (e) {
            return dateString;
        }
    }
    
    function getRatingClass(value, statType) {
        if (statType === 'kd') {
            if (value >= 4) return 'very-high';
            if (value >= 2.5) return 'high';
            if (value >= 1.5) return 'average';
            if (value >= 1) return 'low';
            return 'very-low';
        } else if (statType === 'winRate') {
            if (value >= 20) return 'very-high';
            if (value >= 10) return 'high';
            if (value >= 5) return 'average';
            if (value >= 2) return 'low';
            return 'very-low';
        }
        
        return '';
    }
    
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        loader.style.display = 'none';
        results.style.display = 'none';
    }
    
    function resetUI() {
        errorMessage.style.display = 'none';
        results.style.display = 'none';
        
        // Reset tabs to default (Overall)
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Set Overall as active tab
        document.querySelector('[data-tab="overall"]').classList.add('active');
        document.getElementById('overall-tab').classList.add('active');
    }
});
