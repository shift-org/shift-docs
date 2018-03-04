#!/usr/bin/env bash
#This script is based on Vincent's excellent borzoi.sh script

set -e

SCRIPT_NAME=$1
echo SCRIPT_NAME $SCRIPT_NAME

nshift() {
    SUB=$1
    case ${SUB} in
        "" | "-h" | "--help")
            sub_help
            ;;
        *)
            shift

            set +e
            sub_${SUB} $@

            if [ $? = 127 ]; then
                echo "Error: '${SUB}' is not a known subcommand." >&2
                echo "       Run '${SCRIPT_NAME} --help' for a list of known subcommands." >&2
                exit 1
            fi
            set -e
            ;;
    esac
}


sub_help() { #                    - Show this text
    echo "Usage: ${SCRIPT_NAME} <subcommand> [options]"
    echo "Subcommands:"
    cat nshift.sh | grep '^sub_.*#.*' | sed -E 's/sub_([a-z-]*).*#(.*)/    \1\2/'
}

sub_devinstall() { #              - Installs npm dev dependencies, which the shift site won't do by default because it is a prod node environment
  echo "Installing dev dependencies..."
  npm install --only=dev
}


nshift $1



