with (import <nixpkgs> {});
mkShell {
  buildInputs = [
    nodejs
    yarn
  ];
  shellHook = ''
      export PATH="$PWD/node_modules/.bin/:$PATH"
  '';
}