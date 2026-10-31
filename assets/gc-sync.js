/* Golden Cross Mental Health & Behavioral Center — shared-content sync.
   Makes admin edits (text config + headshot/reel photos) permanent and visible
   on every device. Only site content and image URLs are stored here — no patient
   data. The publishable key is browser-safe; writes are governed by Supabase RLS.
   Golden-Cross data is namespaced under gc_* keys and the golden-cross/ storage
   folder, kept separate from any other site in the project. */
(function () {
  var SB_URL = 'https://wdyiiaxyscqvzzomhwuw.supabase.co';
  var SB_KEY = 'sb_publishable_s4iqMjkPg82Kupy4jLPu4w_b8NqoUHT';
  var T = SB_URL + '/rest/v1/site_content';
  var H = { apikey: SB_KEY, 'Authorization': 'Bearer ' + SB_KEY };
  var BUCKET = 'site-photos';

  function get(key) {
    return fetch(T + '?key=eq.' + encodeURIComponent(key) + '&select=value', { headers: H })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (a) { return (a && a[0]) ? a[0].value : null; })
      .catch(function () { return null; });
  }
  function set(key, value) {
    return fetch(T + '?on_conflict=key', {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal' }, H),
      body: JSON.stringify({ key: key, value: value, updated_at: new Date().toISOString() })
    }).then(function (r) { return r.ok; }).catch(function () { return false; });
  }
  /* Upload an image File to Supabase Storage under golden-cross/; resolves to the public URL. */
  function uploadPhoto(name, file) {
    var path = 'golden-cross/' + name;
    return fetch(SB_URL + '/storage/v1/object/' + BUCKET + '/' + path, {
      method: 'POST',
      headers: Object.assign({ 'x-upsert': 'true',
        'Content-Type': (file && file.type) || 'application/octet-stream',
        'Cache-Control': '3600' }, H),
      body: file
    }).then(function (r) {
      return r.ok ? (SB_URL + '/storage/v1/object/public/' + BUCKET + '/' + path) : null;
    }).catch(function () { return null; });
  }

  window.GCSync = {
    url: SB_URL,
    get: get,
    set: set,
    getConfig: function () { return get('gc_config'); },
    setConfig: function (v) { return set('gc_config', v); },
    getImages: function () { return get('gc_images'); },
    setImages: function (v) { return set('gc_images', v); },
    uploadPhoto: uploadPhoto
  };
})();
