#!/bin/bash -l

. /etc/profile
. ~/.bashrc

cd /home/enver/projects/sailab_aki/aki_backend/src;
/home/enver/miniconda3/envs/aki_web_env/bin/python manage.py patient predict;