// Generate modal content based on event type
function generateModalContent(event) {
    let html = '';
    if (event.type !== 'end-of-wedding') {
        html += `
            <div class="form-group">
                <label><span class="status-badge required" data-field-id="startTime"></span>Start Time</label>
                <input type="time" id="startTime" value="${event.time ? convertTo24Hour(event.time) : ''}">
            </div>
        `;
    }
    // Add event-specific fields based on type
    switch(event.type) {
        case 'ceremony':
            html += `
                <div class="form-group">
                    <label><span class="status-badge required" data-field-id="location"></span>Where will this be taking place?</label>
                    <input type="text" id="location" value="${event.details.location || ''}" placeholder="Location at venue i.e. on patio">
                </div>
                <div class="form-group">
                    <label><span class="status-badge required" data-field-id="arrivalMusicStyle"></span>Style/genre of music as guests arrive</label>
                    <textarea id="arrivalMusicStyle" placeholder="i.e. Piano instrumentals">${event.details.arrivalMusicStyle || ''}</textarea>
                </div>
                ${generateSongInput('processionalSong', 'Processional Song (Wedding Party/Family Members)', event.details.processionalSong, 1)}
                ${generateSongInput('brideEntrance', "Grand Entrance Song", event.details.brideEntrance)}
                <div class="form-group">
                    <label><span class="status-badge required" data-field-id="hasSpecialActivity"></span>Are you doing any special activities during the ceremony such as a unity sand ritual, tying of the knot, etc.?</label>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="hasSpecialActivity" value="yes" ${event.details.hasSpecialActivity === 'yes' ? 'checked' : ''} onchange="toggleSpecialActivityDetails()">
                            <span>Yes</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="hasSpecialActivity" value="no" ${event.details.hasSpecialActivity === 'no' ? 'checked' : ''} onchange="toggleSpecialActivityDetails()">
                            <span>No</span>
                        </label>
                    </div>
                </div>
                <div id="specialActivityDetails" class="conditional-section" style="display: ${event.details.hasSpecialActivity === 'yes' ? 'block' : 'none'};">
                    <div class="form-group">
                        <label><span class="status-badge required" data-field-id="specialActivityType" data-conditional="hasSpecialActivity:yes"></span>What kind of event?</label>
                        <input type="text" id="specialActivityType" value="${event.details.specialActivityType || ''}" placeholder="e.g., Unity sand ritual, Handfasting">
                    </div>
                    <div class="form-group">
                        <label><span class="status-badge required" data-field-id="specialActivitySong" data-conditional="hasSpecialActivity:yes"></span>Do you want a song for your special event?</label>
                        <div class="radio-group">
                            <label class="radio-option">
                                <input type="radio" name="specialActivitySong" value="yes" ${event.details.specialActivitySong === 'yes' ? 'checked' : ''} onchange="toggleSpecialActivitySongEntry()">
                                <span>Yes</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="specialActivitySong" value="no" ${event.details.specialActivitySong === 'no' ? 'checked' : ''} onchange="toggleSpecialActivitySongEntry()">
                                <span>No</span>
                            </label>
                        </div>
                    </div>
                    <div id="specialActivitySongEntry" style="display: ${event.details.specialActivitySong === 'yes' ? 'block' : 'none'};">
                        ${generateSongInput('specialActivitySongTitle', 'Song for Special Activity', event.details.specialActivitySongTitle, 1, 'specialActivitySong:yes')}
                    </div>
                </div>
                ${generateSongInput('recessionalSong', 'Recessional Song', event.details.recessionalSong)}
                <div class="form-group">
                    <label>Other details/anything else we should know?</label>
                    <textarea id="otherDetails" placeholder="Any additional information">${event.details.otherDetails || ''}</textarea>
                </div>
            `;
            break;

        case 'cocktail-hour':
            html += `
                <div class="form-group">
                    <label><span class="status-badge required" data-field-id="location"></span>Where will this be taking place?</label>
                    <input type="text" id="location" value="${event.details.location || ''}" placeholder="Venue name or location">
                </div>
                <div class="form-group">
                    <label><span class="status-badge required" data-field-id="musicChoice"></span>Music style is…</label>
                    <div class="radio-group">
                        <label class="radio-option"><input type="radio" name="musicChoice" value="dj" ${event.details.musicChoice === 'dj' ? 'checked' : ''} onchange="toggleMusicChoice()"><span>DJ's choice</span></label>
                        <label class="radio-option"><input type="radio" name="musicChoice" value="genre" ${event.details.musicChoice === 'genre' ? 'checked' : ''} onchange="toggleMusicChoice()"><span>Specific style/genre</span></label>
                        <label class="radio-option"><input type="radio" name="musicChoice" value="playlist" ${event.details.musicChoice === 'playlist' ? 'checked' : ''} onchange="toggleMusicChoice()"><span>Specific songs/playlist</span></label>
                    </div>
                </div>
                <div id="musicStyleGroup" class="form-group" style="display: ${event.details.musicChoice === 'genre' ? 'block' : 'none'};">
                    <label><span class="status-badge required" data-field-id="musicStyle" data-conditional="musicChoice:genre"></span>Style/Genre</label>
                    <input type="text" id="musicStyle" value="${event.details.musicStyle || ''}" placeholder="e.g., Jazz, Acoustic, Classical">
                </div>
                <div id="cocktailSongsGroup" style="display: ${event.details.musicChoice === 'playlist' ? 'block' : 'none'};">
                    ${generateSongInput('cocktailSongs', 'Specific Songs/Playlist', event.details.cocktailSongs, 20, 'musicChoice:playlist', event.details.cocktailSongs_playlist || '')}
                </div>
                <div class="form-group">
                    <label>Other details/anything else we should know?</label>
                    <textarea id="otherDetails" placeholder="Any additional information">${event.details.otherDetails || ''}</textarea>
                </div>
            `;
            break;

        case 'first-dance':
            html += `
                ${generateSongInput('songChoice', 'Song Selection', event.details.songChoice)}
                <div class="form-group">
                    <label><span class="status-badge required" data-field-id="danceDuration_${event.id}"></span>How long would you like to dance for?</label>
                    <div class="radio-group">
                        <label class="radio-option"><input type="radio" name="danceDuration_${event.id}" value="whole" ${event.details[`danceDuration_${event.id}`] === 'whole' ? 'checked' : ''} onchange="toggleDancePart(${event.id})"><span>Whole song</span></label>
                        <label class="radio-option"><input type="radio" name="danceDuration_${event.id}" value="part" ${event.details[`danceDuration_${event.id}`] === 'part' ? 'checked' : ''} onchange="toggleDancePart(${event.id})"><span>Part of song</span></label>
                    </div>
                </div>
                <div id="dancePartSection_${event.id}" class="time-row" style="display: ${event.details[`danceDuration_${event.id}`] === 'part' ? 'grid' : 'none'};">
                    <div class="form-group">
                        <label><span class="status-badge required" data-field-id="startAt" data-conditional="danceDuration_${event.id}:part"></span>Start at</label>
                        <input type="text" id="startAt" value="${event.details.startAt || ''}" placeholder="00:00" maxlength="5" pattern="[0-9]{2}:[0-9]{2}" oninput="formatTimeInput(this)">
                    </div>
                    <div class="form-group">
                        <label><span class="status-badge required" data-field-id="endAt" data-conditional="danceDuration_${event.id}:part"></span>End at</label>
                        <input type="text" id="endAt" value="${event.details.endAt || ''}" placeholder="00:00" maxlength="5" pattern="[0-9]{2}:[0-9]{2}" oninput="formatTimeInput(this)">
                    </div>
                </div>
                <div class="form-group">
                    <label>Other details/anything else we should know?</label>
                    <textarea id="otherDetails" placeholder="Any additional information">${event.details.otherDetails || ''}</textarea>
                </div>
            `;
            break;

        case 'private-last-dance':
        case 'last-group-dance':
            html += `
                ${generateSongInput('songChoice', 'Song Selection', event.details.songChoice)}
                <div class="form-group">
                    <label>Other details/anything else we should know?</label>
                    <textarea id="otherDetails" placeholder="Any additional information">${event.details.otherDetails || ''}</textarea>
                </div>
            `;
            break;
        case 'end-of-wedding':
            html += `
                <div class="form-group">
                    <label><span class="status-badge required" data-field-id="endTime"></span>Time that wedding ends</label>
                    <input type="time" id="endTime" value="${event.details.endTime || ''}">
                </div>
            `;
            break;

        case 'special-dance-1':
        case 'special-dance-2':
            html += `
                <div class="form-group">
                    <label><span class="status-badge required" data-field-id="danceType_${event.id}"></span>What type of dance is this?</label>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="danceType_${event.id}" value="father-daughter" ${event.details.danceType === 'father-daughter' ? 'checked' : ''} onchange="handleSpecialDanceType(${event.id})">
                            <span>Father Daughter</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="danceType_${event.id}" value="mother-son" ${event.details.danceType === 'mother-son' ? 'checked' : ''} onchange="handleSpecialDanceType(${event.id})">
                            <span>Mother Son</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="danceType_${event.id}" value="other" ${event.details.danceType === 'other' ? 'checked' : ''} onchange="handleSpecialDanceType(${event.id})">
                            <span>Other</span>
                        </label>
                    </div>
                </div>
                <div id="otherDanceTypeContainer_${event.id}" class="conditional-section" style="display: ${event.details.danceType === 'other' ? 'block' : 'none'};">
                    <div class="form-group">
                        <label>Please specify dance type</label>
                        <input type="text" id="otherDanceType_${event.id}" value="${event.details.otherDanceType || ''}" placeholder="e.g., Sibling dance, Grandparent dance" onchange="updateSpecialDanceName(${event.id})">
                    </div>
                </div>
                ${generateSongInput('songChoice', 'Song Selection', event.details.songChoice)}
                <div class="form-group">
                    <label><span class="status-badge required" data-field-id="danceDuration_${event.id}"></span>How long would you like to dance for?</label>
                    <div class="radio-group">
                        <label class="radio-option"><input type="radio" name="danceDuration_${event.id}" value="whole" ${event.details[`danceDuration_${event.id}`] === 'whole' ? 'checked' : ''} onchange="toggleDancePart(${event.id})"><span>Whole song</span></label>
                        <label class="radio-option"><input type="radio" name="danceDuration_${event.id}" value="part" ${event.details[`danceDuration_${event.id}`] === 'part' ? 'checked' : ''} onchange="toggleDancePart(${event.id})"><span>Part of song</span></label>
                    </div>
                </div>
                <div id="dancePartSection_${event.id}" class="time-row" style="display: ${event.details[`danceDuration_${event.id}`] === 'part' ? 'grid' : 'none'};">
                    <div class="form-group">
                        <label><span class="status-badge required" data-field-id="startAt" data-conditional="danceDuration_${event.id}:part"></span>Start at</label>
                        <input type="text" id="startAt" value="${event.details.startAt || ''}" placeholder="00:30" maxlength="5" pattern="[0-9]{2}:[0-9]{2}" oninput="formatTimeInput(this)" required>
                    </div>
                    <div class="form-group">
                        <label><span class="status-badge required" data-field-id="endAt" data-conditional="danceDuration_${event.id}:part"></span>End at</label>
                        <input type="text" id="endAt" value="${event.details.endAt || ''}" placeholder="01:30" maxlength="5" pattern="[0-9]{2}:[0-9]{2}" oninput="formatTimeInput(this)" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Other details/anything else we should know?</label>
                    <textarea id="otherDetails" placeholder="Any additional information">${event.details.otherDetails || ''}</textarea>
                </div>
            `;
            break;

        case 'intros':
            html += `
                <div class="form-group">
                    <label><span class="status-badge required" data-field-id="introduceParty"></span>Will we be introducing your wedding party?</label>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="introduceParty" value="yes" ${event.details.introduceParty === 'yes' ? 'checked' : ''} onchange="toggleWeddingPartySection()">
                            <span>Yes</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="introduceParty" value="no" ${event.details.introduceParty === 'no' ? 'checked' : ''} onchange="toggleWeddingPartySection()">
                            <span>No, just the newlyweds</span>
                        </label>
                    </div>
                </div>
                <div id="weddingPartySection" class="conditional-section" style="display: ${event.details.introduceParty === 'yes' ? 'block' : 'none'};">
                    ${generateSongInput('introSong', 'Wedding Party Introduction Song', event.details.introSong, 1, 'introduceParty:yes')}
                    <div class="form-group">
                        <label><span class="status-badge required" data-field-id="weddingParty" data-conditional="introduceParty:yes"></span>Wedding Party Names (in order)</label>
                        <textarea id="weddingParty" placeholder="List names in order of introduction">${event.details.weddingParty || ''}</textarea>
                    </div>
                </div>
                ${generateSongInput('newlywedsIntroSong', 'Newlyweds Introduction Song', event.details.newlywedsIntroSong)}
                <div class="form-group">
                    <label><span class="status-badge required" data-field-id="coupleIntro"></span>How to introduce couple</label>
                    <input type="text" id="coupleIntro" value="${event.details.coupleIntro || ''}" placeholder="e.g., Mr. & Mrs. Smith">
                </div>
                <div class="form-group">
                    <label>Other details/anything else we should know?</label>
                    <textarea id="otherDetails" placeholder="Any additional information">${event.details.otherDetails || ''}</textarea>
                </div>
            `;
            break;

        case 'blessing':
        case 'welcome':
            const eventType = event.type === 'blessing' ? 'blessing' : 'welcome';
            html += `
                <div class="form-group">
                    <label><span class="status-badge required" data-field-id="givenBy"></span>Who will be giving the ${eventType}?</label>
                    <input type="text" id="givenBy" value="${event.details.givenBy || ''}" placeholder="Name and relationship">
                </div>
                <div class="form-group">
                    <label>Other details/anything else we should know?</label>
                    <textarea id="otherDetails" placeholder="Any additional information">${event.details.otherDetails || ''}</textarea>
                </div>
            `;
            break;

        case 'toasts':
            html += `
                <div class="form-group">
                    <label><span class="status-badge required" data-field-id="toastGivers"></span>Names of those giving toasts</label>
                    <textarea id="toastGivers" placeholder="List names in order and their relationship to the bride/groom i.e. Father of the bride John, Maid of honor Sarah, etc">${event.details.toastGivers || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Other details/anything else we should know?</label>
                    <textarea id="otherDetails" placeholder="Any additional information">${event.details.otherDetails || ''}</textarea>
                </div>
            `;
            break;

        case 'cake-cutting':
            html += `
                ${generateSongInput('cakeSong', 'Cake Cutting Song', event.details.cakeSong)}
                <div class="form-group">
                    <label><span class="status-badge required" data-field-id="makeAnnouncement"></span>Would you like us to make an announcement?</label>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="makeAnnouncement" value="yes" ${event.details.makeAnnouncement === 'yes' ? 'checked' : ''}>
                            <span>Yes</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="makeAnnouncement" value="no" ${event.details.makeAnnouncement === 'no' ? 'checked' : ''}>
                            <span>No</span>
                        </label>
                    </div>
                </div>
                <div class="form-group">
                    <label>Other details/anything else we should know?</label>
                    <textarea id="otherDetails" placeholder="Any additional information">${event.details.otherDetails || ''}</textarea>
                </div>
            `;
            break;

        case 'photo-dash':
            html += `
                ${generateSongInput('photoDashSong', 'Photo Dash Song', event.details.photoDashSong)}
                <div class="form-group">
                    <label><span class="status-badge required" data-field-id="photoDashStyle"></span>How would you like to do the photo dash?</label>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="photoDashStyle" value="center" ${event.details.photoDashStyle === 'center' ? 'checked' : ''} onchange="togglePhotoDashOther()">
                            <span>Couple sits in middle of dance floor and guests stand up to join</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="photoDashStyle" value="tables" ${event.details.photoDashStyle === 'tables' ? 'checked' : ''} onchange="togglePhotoDashOther()">
                            <span>Couple goes around to each table</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="photoDashStyle" value="other" ${event.details.photoDashStyle === 'other' ? 'checked' : ''} onchange="togglePhotoDashOther()">
                            <span>Other</span>
                        </label>
                    </div>
                </div>
                <div id="photoDashOther" class="conditional-section" style="display: ${event.details.photoDashStyle === 'other' ? 'block' : 'none'};">
                    <div class="form-group">
                        <label><span class="status-badge required" data-field-id="photoDashOtherText" data-conditional="photoDashStyle:other"></span>Please explain your photo dash style</label>
                        <textarea id="photoDashOtherText" placeholder="Describe how you'd like to do the photo dash" required>${event.details.photoDashOtherText || ''}</textarea>
                    </div>
                </div>
                <div class="form-group">
                    <label>Other details/anything else we should know?</label>
                    <textarea id="otherDetails" placeholder="Any additional information">${event.details.otherDetails || ''}</textarea>
                </div>
            `;
            break;

        case 'bouquet-toss':
            html += `
                ${generateSongInput('bouquetSong', 'Bouquet Toss Song', event.details.bouquetSong)}
                <div class="form-group">
                    <label>Include Garter Toss?</label>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="garter" value="yes" ${event.details.garter === 'yes' ? 'checked' : ''}>
                            <span>Yes</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="garter" value="no" ${event.details.garter === 'no' ? 'checked' : ''}>
                            <span>No</span>
                        </label>
                    </div>
                </div>
                <div class="form-group">
                    <label>Other details/anything else we should know?</label>
                    <textarea id="otherDetails" placeholder="Any additional information">${event.details.otherDetails || ''}</textarea>
                </div>
            `;
            break;

        case 'dinner':
            html += `
                <div class="form-group">
                    <label><span class="status-badge required" data-field-id="dinnerStyle"></span>Dinner style is...</label>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="dinnerStyle" value="plated" ${event.details.dinnerStyle === 'plated' ? 'checked' : ''} onchange="toggleBuffetRelease()">
                            <span>Plated</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="dinnerStyle" value="buffet" ${event.details.dinnerStyle === 'buffet' ? 'checked' : ''} onchange="toggleBuffetRelease()">
                            <span>Buffet</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="dinnerStyle" value="family" ${event.details.dinnerStyle === 'family' ? 'checked' : ''} onchange="toggleBuffetRelease()">
                            <span>Family Style</span>
                        </label>
                    </div>
                </div>
                <div id="buffetReleaseSection" class="conditional-section" style="display: ${event.details.dinnerStyle === 'buffet' ? 'block' : 'none'};">
                    <div class="form-group">
                        <label>Who will be releasing tables for the buffet line?</label>
                        <div class="radio-group">
                            <label class="radio-option">
                                <input type="radio" name="buffetRelease" value="catering" ${event.details.buffetRelease === 'catering' ? 'checked' : ''}>
                                <span>Catering</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="buffetRelease" value="planner" ${event.details.buffetRelease === 'planner' ? 'checked' : ''}>
                                <span>Planner</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="buffetRelease" value="dj" ${event.details.buffetRelease === 'dj' ? 'checked' : ''}>
                                <span>DJ on mic</span>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label><span class="status-badge required" data-field-id="dinnerMusicChoice"></span>Music style is…</label>
                    <div class="radio-group">
                        <label class="radio-option"><input type="radio" name="dinnerMusicChoice" value="dj" ${event.details.dinnerMusicChoice === 'dj' ? 'checked' : ''} onchange="toggleDinnerMusicChoice()"><span>DJ's choice</span></label>
                        <label class="radio-option"><input type="radio" name="dinnerMusicChoice" value="genre" ${event.details.dinnerMusicChoice === 'genre' ? 'checked' : ''} onchange="toggleDinnerMusicChoice()"><span>Specific style/genre</span></label>
                        <label class="radio-option"><input type="radio" name="dinnerMusicChoice" value="playlist" ${event.details.dinnerMusicChoice === 'playlist' ? 'checked' : ''} onchange="toggleDinnerMusicChoice()"><span>Specific songs/playlist</span></label>
                    </div>
                </div>
                <div id="dinnerMusicStyleGroup" class="form-group" style="display: ${event.details.dinnerMusicChoice === 'genre' ? 'block' : 'none'};">
                    <label><span class="status-badge required" data-field-id="dinnerMusicStyle" data-conditional="dinnerMusicChoice:genre"></span>Style/Genre</label>
                    <input type="text" id="dinnerMusicStyle" value="${event.details.dinnerMusicStyle || ''}" placeholder="e.g., Jazz, Acoustic, Classical">
                </div>
                <div id="dinnerSongsGroup" style="display: ${event.details.dinnerMusicChoice === 'playlist' ? 'block' : 'none'};">
                    ${generateSongInput('dinnerSongs', 'Specific Songs/Playlist', event.details.dinnerSongs, 20, 'dinnerMusicChoice:playlist', event.details.dinnerSongs_playlist || '')}
                </div>
                <div class="form-group">
                    <label>Special Announcements</label>
                    <textarea id="announcements" placeholder="Any announcements during dinner?">${event.details.announcements || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Other details/anything else we should know?</label>
                    <textarea id="otherDetails" placeholder="Any additional information">${event.details.otherDetails || ''}</textarea>
                </div>
            `;
            break;

        case 'open-dancing':
            html += `
                ${generateSongInput('mustPlay', 'Must-Play Songs', event.details.mustPlay, 10, null, event.details.mustPlay_playlist || '')}
                ${generateSongInput('playIfPossible', "Maybe play these if they fit, but all don't need to be played", event.details.playIfPossible, 30, null, event.details.playIfPossible_playlist || '')}
                <div class="form-group">
                    <label>Songs, artists, or genres to avoid</label>
                    <textarea id="doNotPlay" placeholder="Songs, artists, or genres to avoid">${event.details.doNotPlay || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Preferred Music Style</label>
                    <input type="text" id="danceStyle" value="${event.details.danceStyle || ''}" placeholder="Genres or era">
                </div>
                <div class="form-group">
                    <label>Line Dances</label>
                    ${generateLineDanceOptions('cha-cha-slide', 'Cha-Cha Slide', event.details.lineDances)}
                    ${generateLineDanceOptions('electric-slide', 'Electric Slide', event.details.lineDances)}
                    ${generateLineDanceOptions('cupid-shuffle', 'Cupid Shuffle', event.details.lineDances)}
                    ${generateLineDanceOptions('wobble', 'Wobble', event.details.lineDances)}
                    ${generateLineDanceOptions('watermelon-crawl', 'Watermelon Crawl', event.details.lineDances)}
                    ${generateLineDanceOptions('git-up', 'The Git Up', event.details.lineDances)}
                    ${generateLineDanceOptions('copperhead-road', 'Copperhead Road', event.details.lineDances)}
                    ${generateLineDanceOptions('cotton-eye-joe', 'Cotton Eye Joe', event.details.lineDances)}
                    ${generateLineDanceOptions('macarena', 'Macarena', event.details.lineDances)}
                    ${generateLineDanceOptions('ymca', 'YMCA', event.details.lineDances)}
                    <div style="margin-top: 16px; padding: 12px; background: #f8f9fa; border-radius: 8px;">
                        <label class="radio-option" style="display: flex; align-items: center; margin-bottom: 8px;">
                            <input type="checkbox" name="lineDanceOther" ${event.details.lineDanceOtherEnabled ? 'checked' : ''} onchange="toggleLineDanceOther()">
                            <span style="font-weight: 600;">Other</span>
                        </label>
                        <div id="lineDanceOtherText" style="display: ${event.details.lineDanceOtherEnabled ? 'block' : 'none'}; margin-top: 8px;">
                            <textarea id="lineDanceOtherDetails" placeholder="List any other line dances and preferences">${event.details.lineDanceOtherDetails || ''}</textarea>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label>Other details/anything else we should know?</label>
                    <textarea id="otherDetails" placeholder="Any additional information">${event.details.otherDetails || ''}</textarea>
                </div>
            `;
            break;

        case 'grand-exit':
            html += `
                <div class="form-group">
                    <label><span class="status-badge required" data-field-id="exitStyle"></span>Exit Style</label>
                    <select id="exitStyle">
                        <option value="">Select...</option>
                        <option value="sparklers" ${event.details.exitStyle === 'sparklers' ? 'selected' : ''}>Sparklers</option>
                        <option value="bubbles" ${event.details.exitStyle === 'bubbles' ? 'selected' : ''}>Bubbles</option>
                        <option value="confetti" ${event.details.exitStyle === 'confetti' ? 'selected' : ''}>Confetti</option>
                        <option value="other" ${event.details.exitStyle === 'other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Where will it be taking place?</label>
                    <textarea id="instructions" placeholder="So we can tell people where to go">${event.details.instructions || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Other details/anything else we should know?</label>
                    <textarea id="otherDetails" placeholder="Any additional information">${event.details.otherDetails || ''}</textarea>
                </div>
            `;
            break;

        case 'custom':
            html += `
                ${generateSongInput('songChoice', 'Song Selection', event.details.songChoice)}
                <div class="form-group">
                    <label>Other details/anything else we should know?</label>
                    <textarea id="otherDetails" placeholder="Add any details about this event">${event.details.otherDetails || ''}</textarea>
                </div>
            `;
            break;

        case 'shoe-game':
            const questions = Array.isArray(event.details.questions) ? event.details.questions : (event.details.questions ? [event.details.questions] : []);
            html += `
                <div class="form-group">
                    <label><span class="status-badge required" data-field-id="shoeQuestion_0"></span>Question #1</label>
                    <input type="text" id="shoeQuestion_0" value="${questions[0] || ''}" placeholder="Type your first question" required>
                </div>
                <div id="shoeQuestionsExtra">
                    ${questions.slice(1).map((q, idx) => `
                        <div class=\"form-group\"> 
                            <label><span class="status-badge optional" data-field-id="shoeQuestion_${idx + 1}"></span>Question #${idx + 2}</label>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <input type=\"text\" id=\"shoeQuestion_${idx + 1}\" value=\"${q}\" placeholder=\"Type your question\" style=\"flex: 1;\"> 
                                <button class="shoe-question-remove-btn" onclick="removeShoeQuestion(${event.id}, ${idx + 1}); return false;" style="width: 32px; height: 32px; background: #ff6b6b; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; padding: 0;">
                                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width: 18px; height: 18px; fill: #fff;">
                                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="form-group">
                    <button class="song-action-btn" onclick="addShoeQuestion(${event.id}); return false;">+ Add a question</button>
                </div>
            `;
            break;

        default:
            html += `
                ${generateSongInput('songChoice', 'Song Selection', event.details.songChoice)}
                <div class="form-group">
                    <label>Other details/anything else we should know?</label>
                    <textarea id="otherDetails" placeholder="Add any details about this event">${event.details.otherDetails || ''}</textarea>
                </div>
            `;
    }

    // Delete button moved to modal footer

    return html;
}
