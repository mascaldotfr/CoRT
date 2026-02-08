FROM debian:trixie

# User running PHP and owning CoRT
ENV PHP_USER="www-data"
# If set to any other value than yes, don't prepopulate from official API
# server
ARG PREPOPULATE="yes"

RUN apt-get update && \
	    apt-get install -y --no-install-recommends \
	    ca-certificates \
	    caddy \
	    cron \
	    procps \
	    sudo \
	    git \
	    wget \
	    php-cli \
	    php-curl \
	    php-fpm \
	    php-sqlite3 \
	    php-zip \
	    composer

# Copy caddyfile
COPY Caddyfile /etc/caddy/Caddyfile

# Configure caddy root
RUN mkdir -p /var/www/html/CoRT && \
	chown -R caddy:caddy /var/www && \
	chown $PHP_USER:$PHP_USER /var/www/html/CoRT

# git clone
# and remove preload linking to the official API
RUN sudo -u $PHP_USER git clone https://codeberg.org/mascal/CoRT.git /var/www/html/CoRT && \
	sudo -u $PHP_USER sed -i '/<link rel="preload"/d' /var/www/html/CoRT/*.html
# XXX Note that you can't git pull or it will overwrite some or even all the
# above changes. See ̀ /deploy/README.md`. Also you will need to modify
# `api/bin/lib/eaheader.php`'s FRONTSITE constant if the website and the API
# aren't on the same domain.

# Install required php dependencies (only needed for warstatus)
WORKDIR /var/www/html/CoRT/
RUN sudo -u $PHP_USER composer install

# API pre configuration starting ...
WORKDIR /var/www/html/CoRT/api/var

RUN if test "$PREPOPULATE" != "yes"; then \
	touch -d "1 week ago" 	trainer_saved_setups.txt \
				trainer_saved_setups.txt.gz \
				trainerstats.json \
				trainerstats.json.gz \
				events_dump.csv \
				events_dump.csv.gz \
				maintenance.txt \
	; \
	fi
RUN if test "$PREPOPULATE" = "yes"; then \
	wget 	https://cort.ovh/api/var/trainer_saved_setups.txt \
		https://cort.ovh/api/var/events.sqlite \
		https://cort.ovh/api/var/warstatus.json \
		https://cort.ovh/api/var/statistics.json \
		https://cort.ovh/api/var/allevents.json \
	; \
	fi

# API post configuration; you're better off running everything as www-data,
# it's easier
RUN touch maintenance.txt
RUN chown -R $PHP_USER:$PHP_USER /var/www/html/CoRT


# Copy cron job script
COPY cort-cron /etc/cron.d/cort-cron
RUN chmod 0644 /etc/cron.d/cort-cron
RUN sed -i'' 's/CORT_USER/'$PHP_USER'/' /etc/cron.d/cort-cron

# Open port 80
EXPOSE 80

# Start cron, php-fpm and caddy
CMD ["sh", "-c", "service cron start; service php8.4-fpm start; exec sudo -u caddy caddy run --config /etc/caddy/Caddyfile"]
