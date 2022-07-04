#!/bin/bash -e

declare -a tmpfiles
root="$(readlink -f $0)"
root="${root/\/util\/build.sh/}"
out="${root}/out"
build="${out}/build"
cmd="build"

remove () {
  rm -f "$@"
}

make_separator () {
  echo "${RANDOM}-${RANDOM}-${RANDOM}-${RANDOM}-${RANDOM}"
}

make_data_url () {
  src="${root}/$1"
  mime_type="$(file -b --mime-type ${src})"
  echo -n "data:${mime_type};base64,"
  base64 "${src}" | tr -d '\n'
}

inline_assets () {
  src="${root}/assets/assets.js"
  dst="${build}/assets/assets.js"
  mkdir -p "$(dirname "${dst}")"
  eot="EOT-$(make_separator)"
  (
    echo "root=\"${root}\""
    declare -f make_data_url
    echo "cat << ${eot}"
    sed 's/'"'"'\([^'"'"']\+\)'"'"'/'"'"'$(make_data_url "\1")'"'"'/g' < "${src}"
    echo
    echo "${eot}"
  ) > "${dst}.inl"
  bash "${dst}.inl" > "${dst}"
  remove "${dst}.inl"
}

inline_html () {
  src="${root}/index.html"
  dst="${build}/index.html"
  mkdir -p "$(dirname "${dst}")"
  eot="EOT-$(make_separator)"
  (
    echo "root=\"${root}\""
    declare -f make_data_url
    echo "cat << ${eot}"
    sed 's/url(\([^)]\+\))/url($(make_data_url "\1"))/g' < "${src}"
    echo
    echo "${eot}"
  ) > "${dst}.inl"
  bash "${dst}.inl" > "${dst}"
  remove "${dst}.inl"
}

rollup_js () {
  dst="${out}/main.js"
  bld="${build}/main.js.build"
  mkdir -p "${bld}"
  [ -e "${bld}/main.js" ] || ln -s "${root}"/*.js "${bld}/"
  [ -e "${bld}/assets" ] || ln -s "${build}/assets" "${bld}/assets"
  [ -e "${bld}/lib" ] || ln -s "${root}/lib" "${bld}/lib"
  cat << EOT > "${bld}/rollup.config.js"
import { terser } from "rollup-plugin-terser";
import { minifyHTML } from "rollup-plugin-minify-html";

export default {
  input: "${bld}/main.js",
  output: {
    file: "${dst}",
    format: "es",
  },
  plugins: [
    terser(),
    minifyHTML({
      targets: [
        {
          src: "${build}/index.html",
          dest: "${out}/index.html",
        }
      ],
      minifierOptions: {
        collapseBooleanAttributes: true,
        collapseWhitespace: true,
        decodeEntities: true,
        minifyCSS: true,
        removeAttributeQuotes: true,
        removeComments: true,
        sortAttributes: true,
      },
    }),
  ],
  preserveSymlinks: true,
};
EOT
  rollup --config "${bld}/rollup.config.js"
  remove -R "${bld}"
}

while [ $# -gt 0 ]
do
  cmd="$1"
  shift
done

case "${cmd}" in
  build)
    echo "build ${out}"
    inline_assets
    inline_html
    rollup_js
    remove -R "${build}"
    ;;
  clean)
    echo "clean ${out}"
    rm -fR "${out}"
    ;;
esac

