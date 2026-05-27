# Snapshot file
# Unset all aliases to avoid conflicts with functions
unalias -a 2>/dev/null || true
shopt -s expand_aliases
# Check for rg availability
if ! (unalias rg 2>/dev/null; command -v rg) >/dev/null 2>&1; then
  function rg {
  local _cc_bin="${CLAUDE_CODE_EXECPATH:-}"
  [[ -x $_cc_bin ]] || _cc_bin=$(command -v claude 2>/dev/null)
  if [[ ! -x $_cc_bin ]]; then command rg "$@"; return; fi
  if [[ -n $ZSH_VERSION ]]; then
    ARGV0=rg "$_cc_bin" "$@"
  elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
    ARGV0=rg "$_cc_bin" "$@"
  elif [[ $BASHPID != $$ ]]; then
    exec -a rg "$_cc_bin" "$@"
  else
    (exec -a rg "$_cc_bin" "$@")
  fi
}
fi
export PATH='/c/Users/aptpa/bin:/mingw64/bin:/usr/local/bin:/usr/bin:/bin:/mingw64/bin:/usr/bin:/c/Users/aptpa/bin:/c/Program Files/Microsoft SDKs/Azure/CLI2/wbin:/c/Python313/Scripts:/c/Python313:/c/WINDOWS/system32:/c/WINDOWS:/c/WINDOWS/System32/Wbem:/c/WINDOWS/System32/WindowsPowerShell/v1.0:/c/WINDOWS/System32/OpenSSH:/cmd:/c/xampp/php:/c/ProgramData/ComposerSetup/bin:/c/Program Files/Microsoft SQL Server/150/Tools/Binn:/c/Program Files/Microsoft SQL Server/Client SDK/ODBC/170/Tools/Binn:/c/Program Files/dotnet:/c/Users/aptpa/AppData/Local/nvm:/c/nvm4w/nodejs:/c/ProgramData/chocolatey/bin:/c/Users/aptpa/AppData/Roaming/Python/Python313/Scripts:/c/Users/aptpa/AppData/Roaming/Python/Python313/site-packages:/c/Program Files/nodejs:/c/sqlite:/c/Program Files/Docker/Docker/resources/bin:/c/Program Files/WireGuard:/c/Users/aptpa/anaconda3:/c/Users/aptpa/anaconda3/Library/mingw-w64/bin:/c/Users/aptpa/anaconda3/Library/usr/bin:/c/Users/aptpa/anaconda3/Library/bin:/c/Users/aptpa/anaconda3/Scripts:/c/Users/aptpa/AppData/Local/Microsoft/WindowsApps:/c/Users/aptpa/AppData/Roaming/Composer/vendor/bin:/c/Program Files/JetBrains/PhpStorm 2025.1.2/bin:/c/Users/aptpa/.dotnet/tools:/c/Users/aptpa/AppData/Local/Programs/cursor/resources/app/bin:/c/Users/aptpa/AppData/Local/nvm:/c/nvm4w/nodejs:/c/Users/aptpa/AppData/Local/Programs/Microsoft VS Code/bin:/c/Program Files/JetBrains/PyCharm 2025.2.3/bin:/c/Users/aptpa/AppData/Local/Programs/Antigravity/bin:/c/Users/aptpa/AppData/Roaming/npm:/c/Users/aptpa/AppData/Local/Programs/Ollama:/c/Users/aptpa/AppData/Local/GitHubDesktop/bin:/c/Users/aptpa/.local/bin:/usr/bin/vendor_perl:/usr/bin/core_perl'
