var checkURL = function (url) {
  if (typeof url !== 'string') return false
  try {
    const base = url.startsWith('/') ? window.location.origin : undefined
    new URL(url, base)
    return true
  } catch(e) {
    return false
  }
}