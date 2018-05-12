#!/usr/bin/env bash
set -e

if false; then
    source "../nift" --source-only
fi

nift() {
    if [ NIFT_SLEEP ]; then
        sleep ${NIFT_SLEEP}
    fi

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
SCRIPT_NAME=$(basename $0)

sub_help() { #                    - Show this text
    echo "Usage: ${SCRIPT_NAME} <subcommand> [options]"
    echo "Subcommands:"
    cat ${NIFT}/nift.sh | grep '^sub_.*#.*' | sed -E 's/sub_([a-z-]*).*#(.*)/    \1\2/'
}

sub_up() { #                      - Bring all services up
    echo "${NIFT_MOTD}"
    sub_compose up -d ${SERVICES}
}

sub_down() { #                    - Stop and remove services
    echo "${NIFT_MOTD}"
    sub_compose down
}

sub_ps() { #                      - Print service information
    echo "${NIFT_MOTD}"
    sub_compose ps
}

sub_reload() { # <service>, ...   - Trigger a code/conf reload
    echo "${NIFT_MOTD}"
    echo Reloading $@
    sub_compose kill -s SIGHUP $@
}

sub_start() { # <service>, ..     - Start service(s)
    echo "${NIFT_MOTD}"
    sub_compose up -d $@
}

sub_stop() { # <service>, ...     - Stop service(s)
    echo "${NIFT_MOTD}"
    sub_compose kill $@
}

sub_restart() { # <service>, ...  - Trigger entrypoint.sh, required after modifying anything in bitpool
    echo "${NIFT_MOTD}"
    sub_stop $@
    sub_start $@
}

sub_rebuild() { # <service>, ...  - Remove and rebuild a service
    echo "${NIFT_MOTD}"
    echo Rebuilding $@
    sub_stop $@
    sub_compose rm -f $@
    sub_compose up -d $@
}

sub_attach() { # <service>        - Run bash on a running service
    echo "${NIFT_MOTD}"
    sub_compose exec $@ bash
}

sub_compose() { # <cmd...>        - Run a compose with associated files
    docker-compose ${COMPOSE_FILES} $@
}

sub_logs() { # <service>, ...     - Show last 50 lines and attach to a service
    echo "${NIFT_MOTD}"
    sub_compose logs --tail=50 -f $@
}


sub_mysql() { #                   - Open a mysql prompt with the db selected
    sub_compose exec db mysql -u ${MYSQL_USER} -h db -P 3306 -p"${MYSQL_PASSWORD}" ${MYSQL_DATABASE} $@
}

sub_mysql-pipe() { #              - Pipe sql into this command to send to db
    docker exec -i $(sub_compose ps -q db) mysql -u ${MYSQL_USER} -h db -P 3306 -p"${MYSQL_PASSWORD}" ${MYSQL_DATABASE} $@
}

sub_mysqldump() { #               - Dump the mysql database
    sub_compose exec db mysqldump -u ${MYSQL_USER} -h db -P 3306 -p"${MYSQL_PASSWORD}" ${MYSQL_DATABASE} $@
}
