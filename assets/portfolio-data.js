/* ─────────────────────────────────────────────────────────────────────────
   PORTFOLIO CONTENT — edit this file only. No design changes needed.
   Add a project: copy a block inside `projects` and change the text.
   Add a case study: give a `heroProjects` entry a `caseStudy` block.
   Add a field note: copy a block inside `notes`.
   Everything below drives index.html, case.html and blog.html.
   See MAINTAINING.md for the how-to.
   ───────────────────────────────────────────────────────────────────────── */
window.PORTFOLIO_DATA = {

  profile: {
    name: "Himanshu Kumar Jha",
    // sheet: "SHEET 01 / REV 2026.08",
    kicker: ["Software engineer", "New Delhi, India"],
    headline: "I build things that turn models and data into working products",
    // One line under the headline: who you do it for. Recruiters and clients
    // read this before anything else on the page.
    pitch: "I take models and messy data the rest of the way — into services that run in production, with the pipelines, storage and observability around them.",
    summary: "Backend, computer vision and cloud infrastructure. Currently architecting a model-agnostic CV platform at Cognecto — FastAPI over PostgreSQL, GPU-served inference, ten-plus containerised services in one real-time pipeline.",
    resumeUrl: "https://drive.google.com/file/d/18DzcaRl_boqqJVZBP1j8kMtow-h729LU/view?usp=drive_link",
    email: "himanshukrjha004@gmail.com",
    // phone: "+91 85951 91981",
    linkedin: "https://linkedin.com/in/himanshu-kumar-jha-software-engineer",
    github: "https://github.com/himanshu-kr-jha",
    githubUser: "himanshu-kr-jha"
  },

  // The three cards under the headline
  titleBlocks: [
    { label: "Current post", title: "AI Engineer · Cognecto", meta: "2026.08 — Present · On-site" },
    { label: "Qualification", title: "B.Tech SE · DTU", meta: "2022 — 2026 · CGPA 8.8 / 10" }
  ],
  publication: {
    label: "Publication",
    title: "Minimizing False Alarms in Real-Time Surveillance via Hierarchical Multimodal Fusion",
    meta: "Springer LNNS · ICDAM-2026 · top 20%"
  },

  // 01 · SELECTED WORK — the deep case studies.
  //
  // `slug` gives the entry its own page at case.html?p=<slug>.
  // `caseStudy` is optional: an entry without one simply shows no link, so you
  // can add depth one project at a time. Sections render in the order written;
  // each is { label, paras[], bullets[] } and every field is optional.
  heroProjects: [
    {
      slug: "voter-segmentation",
      kicker: "DWG 01 · Election Commission of India",
      title: "Voter Segmentation & Field-Verification Platform",
      paras: [
        "A deterministic, grid-based geospatial engine that partitions electoral rolls into balanced segments while treating each family as an indivisible atomic unit — zero split households, every time.",
        "A companion web app lets field administrators and Booth Level Officers reach and digitally verify voters against GPS data. Validated across four assembly constituencies in Uttar Pradesh on public electoral-roll data."
      ],
      tags: ["TypeScript", "Node.js", "PostgreSQL", "Turf.js", "Next.js", "Docker"],
      metrics: [
        { value: "100%", label: "household integrity" },
        { value: "04", label: "constituencies validated" }
      ],
      note: "Client work — walkthrough on request",
      linkHref: "",
      linkLabel: "",
      caseStudy: {
        role: "Backend and geospatial engine, plus the field-verification web app",
        summary: "Electoral rolls have to be split into workable rounds for the officers who walk them — without ever cutting a household in half.",
        sections: [
          {
            label: "Context",
            paras: [
              "Booth Level Officers verify voters door to door. To plan that work, a constituency's roll has to be divided into segments small enough for one officer to cover and even enough that no one is handed twice the workload of their neighbour.",
              "The catch is that a roll is a list of people, while the work is done at doorsteps. Split a family across two segments and two officers walk to the same door — or worse, neither does."
            ]
          },
          {
            label: "Constraints",
            bullets: [
              "A household is atomic. Segment balance can never be bought by splitting a family.",
              "The partition has to be deterministic: the same roll must always produce the same segments, so results are reproducible and auditable rather than a fresh guess each run.",
              "Public electoral-roll data only — no private records anywhere in the pipeline.",
              "Officers work in the field on phones, against GPS, often with poor connectivity."
            ]
          },
          {
            label: "Approach",
            paras: [
              "Voters are grouped into households first, and the household — not the voter — becomes the unit the partitioner moves. Everything downstream operates on those units, so splitting a family is not a case that has to be guarded against; it is not representable.",
              "Households are then placed on a geographic grid and grouped into balanced segments with Turf.js handling the geometry, so a segment is contiguous ground an officer can actually walk rather than a set of rows that happen to sum correctly.",
              "The roll, the households and the resulting segments live in PostgreSQL. A Next.js app sits on top for administrators to review and assign segments, and for Booth Level Officers to record verification against GPS position. The whole stack ships in Docker so a constituency can be re-run from scratch."
            ]
          },
          {
            label: "Decisions worth naming",
            bullets: [
              "Deterministic over adaptive. A partitioner that optimises harder but differently on each run is unusable for something that has to be checked and defended.",
              "Family-atomic before balanced. Household integrity is a hard constraint; balance is the thing that gets optimised inside it.",
              "Grid-based over clustering. A grid gives contiguous, explainable segments — an officer can see why their patch is their patch."
            ]
          },
          {
            label: "Outcome",
            paras: [
              "Zero split households across every run — the guarantee holds by construction, not by validation after the fact. Validated across four assembly constituencies in Uttar Pradesh on public electoral-roll data."
            ]
          }
        ]
      }
    },
    {
      slug: "compaction-pass-detection",
      kicker: "DWG 02 · Private client · road telemetry",
      title: "Roller Compaction-Pass Detection",
      paras: [
        "The pass-detection algorithm that computes how many compaction passes a road roller has made per section, straight from raw multi-source telemetry — 1 Hz GPS position fused with roughly two-minute sensor feeds.",
        "Paired with an interactive AG-Grid dashboard surfacing thirteen per-pass metrics — direction, lane, chainage, duration, distance, speed — with daily totals per asset across left, centre and right lanes."
      ],
      tags: ["Python", "GeoPandas", "Shapely", "SciPy", "AWS Timestream", "AG-Grid"],
      metrics: [
        { value: "13", label: "per-pass metrics per section" },
        { value: "1 Hz", label: "GPS + ~2-min sensor feeds" }
      ],
      note: "Private client — walkthrough on request",
      linkHref: "",
      linkLabel: "",
      caseStudy: {
        role: "Pass-detection algorithm and the metrics behind the dashboard",
        summary: "Road compaction is specified in passes. The machines report position and sensor readings — nobody reports passes.",
        sections: [
          {
            label: "Context",
            paras: [
              "A road roller has to cover each section of road a specified number of times before the surface is signed off. What arrives from the machines is telemetry: a position stream and a set of sensor feeds. The count everyone actually cares about has to be derived.",
              "The question is deceptively simple and gets hard immediately: a roller reverses over ground it has already covered, drifts between lanes, idles, and works the same chainage across multiple days."
            ]
          },
          {
            label: "Constraints",
            bullets: [
              "The feeds do not agree on time. Position arrives at 1 Hz; sensor readings roughly every two minutes. Anything computed per pass has to bridge that gap without inventing readings.",
              "Resolution is per lane — left, centre and right are separate work, not one averaged road.",
              "The output is a compliance artefact, so a number has to be traceable back to the telemetry that produced it.",
              "Raw feeds, with the gaps, noise and duplicate points that implies."
            ]
          },
          {
            label: "Approach",
            paras: [
              "Positions are projected onto the road's centreline, which converts a wandering GPS track into chainage — distance along the road — and turns a two-dimensional problem into a one-dimensional one. Lane assignment comes from offset against that same centreline.",
              "The road is cut into sections, and a pass becomes a contiguous run of travel through a section in one direction. Direction changes and idling split runs, so reversing over the same ground counts as the second pass it actually is rather than one long one.",
              "The slower sensor feeds are aligned to those runs on time rather than resampled up, so a pass carries the readings that genuinely overlap it. GeoPandas and Shapely handle the geometry, SciPy the signal work, and the results land in AWS Timestream, which is built for exactly this shape of data.",
              "An AG-Grid dashboard exposes thirteen metrics per pass — direction, lane, chainage, duration, distance, speed among them — with daily totals per asset across the three lanes."
            ]
          },
          {
            label: "Decisions worth naming",
            bullets: [
              "Chainage as the primary coordinate. Almost every hard case gets easier once the road is a line rather than a map.",
              "Align the slow feeds to passes rather than interpolating them to 1 Hz. Interpolation would have produced smooth, confident, invented numbers.",
              "A time-series store for time-series data, instead of forcing the shape into a relational schema."
            ]
          },
          {
            label: "Outcome",
            paras: [
              "Thirteen metrics per pass per section, and daily per-asset totals split across left, centre and right lanes — derived end to end from raw 1 Hz GPS and roughly two-minute sensor feeds."
            ]
          }
        ]
      }
    },
    {
      slug: "strength-mma",
      kicker: "DWG 03 · Freelance · combat-sports academy",
      title: "Strength MMA",
      paras: [
        "A responsive Next.js site built and launched for a combat-sports academy, with on-page SEO carried through semantic markup, meta tags and optimised imagery. Organic search drove 34% of traffic in the first three months."
      ],
      tags: ["Next.js", "React", "SEO", "Vercel"],
      metrics: [
        { value: "34%", label: "of traffic from organic search, first 3 months" }
      ],
      note: "",
      linkHref: "https://strengthmma.com/",
      linkLabel: "Visit strengthmma.com ↗",
      caseStudy: {
        role: "Freelance — design build, development and launch",
        summary: "A local academy whose new students came by word of mouth, and who wanted to be findable by the people already searching for them.",
        sections: [
          {
            label: "Context",
            paras: [
              "A combat-sports academy needed a site that did more than exist. The people it wants are already searching — for classes, for a discipline, for somewhere nearby — and the academy was not showing up for them."
            ]
          },
          {
            label: "Constraints",
            bullets: [
              "Most visitors arrive on a phone, often on a slow connection.",
              "Photography is the point in this category, and photography is what makes a page heavy.",
              "A small business needs a site that stays cheap and needs no maintenance contract to keep running."
            ]
          },
          {
            label: "Approach",
            paras: [
              "Built in Next.js so pages ship as real HTML, which is what search engines index and what makes a first visit fast on mobile.",
              "SEO handled on the page rather than bolted on: semantic markup so the structure is legible to a crawler, meta tags written per page rather than templated once, and imagery optimised so the visual weight the category demands does not cost the load time.",
              "Deployed on Vercel, which keeps hosting effectively free at this scale and takes the operational burden off the client entirely."
            ]
          },
          {
            label: "Outcome",
            paras: [
              "Organic search accounted for 34% of traffic in the first three months — visitors who found the academy rather than being sent to it. The site is live at strengthmma.com."
            ]
          }
        ]
      }
    }
  ],

  // 02 · MORE PROJECTS — the expandable rows. Numbers are assigned automatically.
  projects: [
    {
      title: "Excavator Monitoring System",
      stack: "Docker · AWS ECS · Lambda · S3 · Timestream",
      detail: "A resilient, cloud-native AWS workflow that classifies excavator activity from video streams with 95% precision, via a data-ingestion pipeline that segments large-scale surveillance footage into 60-second intervals for continuous utilisation analytics.",
      metric: "95% classification precision",
      link: "https://github.com/himanshu-kr-jha/Automated-Excavator-Monitoring-Service",
      linkLabel: "GitHub"
    },
    {
      title: "ETA Predict",
      stack: "Python · Gradient Boosting · GCP · Docker",
      detail: "Delivery-time estimates from a Gradient Boosting model (R² 0.81, MAE 6.6 min) behind a serverless MLOps pipeline that drops redeployment from weeks to under seven minutes at under ₹170/month — and swaps in any other model without touching the pipeline.",
      metric: "R² 0.81 · MAE 6.6 min",
      link: "https://etapredict.onrender.com",
      linkLabel: "Live demo"
    },
    {
      title: "FormerPose — 6D pose estimation",
      stack: "PyTorch · OpenCV · Point clouds · Transformers",
      detail: "A reproduction of the FormerPose (2024) research model for RGB-D 6D object pose estimation, reaching 0.0667 m mean ADD on LINEMOD with multi-scale transformers, point-cloud fusion and ICP refinement.",
      metric: "0.0667 m mean ADD",
      link: "https://github.com/himanshu-kr-jha/formerPose_implementation",
      linkLabel: "GitHub"
    },
    {
      title: "LogDaily — habit & sleep tracking",
      stack: "React · Node.js · MongoDB Atlas · Google OAuth",
      detail: "A full-stack habit and sleep tracker with Google OAuth, cloud-synced data and a responsive analytics dashboard — trends, streaks and insights charted from JWT-authenticated MongoDB Atlas data.",
      metric: "Auth to analytics, full stack",
      link: "https://logdaily.netlify.app",
      linkLabel: "Live site"
    },
    {
      title: "Destinate It",
      stack: "Node.js · Express · MongoDB · Bootstrap",
      detail: "A platform for adding and exploring local and famous places, with authentication, role-based access, place tagging, nearby search and filtering — a 10% lift in user engagement after launch.",
      metric: "+10% user engagement",
      link: "https://destinateit.onrender.com",
      linkLabel: "Live site"
    },
    {
      title: "Code Ledger",
      stack: "JavaScript · Chrome Extension · Google Sheets API",
      detail: "A Chrome extension that logs solved coding problems straight to Google Sheets — title, URL, status and remarks in a single click, so practice history keeps itself.",
      metric: "One-click problem logging",
      link: "https://github.com/himanshu-kr-jha/CodeLedger",
      linkLabel: "GitHub"
    },
    {
      title: "Automobile Failure Detection",
      stack: "Scikit-learn · TensorFlow · Pandas · NumPy",
      detail: "A comparative analysis of ML algorithms for predicting automobile failures, lifting predictive accuracy by 25% through advanced preprocessing so maintenance can be scheduled before a breakdown.",
      metric: "+25% predictive accuracy",
      link: "https://github.com/himanshu-kr-jha/automobile-predictive-failure",
      linkLabel: "GitHub"
    }
  ],

  // 03 · EXPERIENCE
  experience: [
    // Several posts at one company go in `roles` rather than as separate
    // entries — the block then reads as one continuous stint with a promotion
    // in it, which is what actually happened. An entry with no `roles` keeps
    // the flat shape and renders exactly as it always has.
    {
      org: "Cognecto",
      period: "2026.01 — present",
      duration: "9 mos",
      place: "Bengaluru, India",
      roles: [
        {
          role: "AI Engineer",
          type: "Full-time",
          period: "2026.08 — present",
          duration: "2 mos",
          place: "On-site",
          bullets: [
            "Architected the backend of a model-agnostic computer-vision platform so a new detector or classifier plugs in without code changes — async FastAPI over PostgreSQL with async SQLAlchemy and Alembic, cutting new-model onboarding from days to a config step.",
            "Engineered a real-time video-processing pipeline orchestrating 10+ containerised services across ingest, inference and observability, with dual JWT / API-key auth and metrics at every stage."
          ],
          tags: ["FastAPI", "PostgreSQL", "Model serving", "Docker Compose"]
        },
        {
          role: "AI Engineer",
          type: "Internship",
          period: "2026.01 — 2026.07",
          duration: "7 mos",
          place: "Remote",
          bullets: [
            "Independently delivered a cross-platform field app for geo-tagged video capture — resumable uploads, offline queueing and managed auth."
          ],
          tags: ["React Native", "Mobile"]
        }
      ]
    },
    {
      org: "Accenture",
      period: "2025.06 — 2025.07",
      place: "On-site · Bengaluru",
      role: "Advanced Application Engineer, Intern",
      bullets: [
        "Developed a delivery-ETA prediction service around a Gradient Boosting model (R² 0.81, MAE 6.6 min), deployed through an automated, model-agnostic serverless MLOps pipeline on GCP.",
        "Cut redeployment from weeks to under seven minutes and operating cost to under ₹170/month — roughly 4% of the standard approach."
      ],
      tags: ["GCP", "Python", "MLOps", "Docker"]
    },
    {
      org: "Cognecto",
      period: "2024.05 — 2024.07",
      place: "Remote · Delhi",
      role: "Machine Learning Engineer, Intern",
      bullets: [
        "Built an excavator-monitoring service on YOLO and OpenCV, classifying machine activity from surveillance video at 95% precision for continuous utilisation analytics."
      ],
      tags: []
    }
  ],

  // 04 · SKILLS
  specs: [
    { label: "Languages", value: "Python · Java · JavaScript · TypeScript · SQL · C" },
    { label: "Backend", value: "FastAPI · Node.js · Express · REST APIs · WebSockets / WebRTC · async SQLAlchemy · Microservices" },
    { label: "Databases", value: "PostgreSQL · MySQL · MongoDB · Supabase · Alembic migrations" },
    { label: "Cloud & DevOps", value: "AWS (ECS, Lambda, S3, ECR, CloudWatch) · GCP · Docker · CI/CD · Git · Prometheus / Grafana" },
    { label: "Fundamentals", value: "DSA · OOP · Operating Systems · DBMS · Computer Networks · System Design" },
    { label: "Certifications", value: "NPTEL Elite + Gold · Supervised Machine Learning (DeepLearning.AI & Stanford)" },
    { label: "Education", value: "B.Tech Software Engineering, DTU (2022—2026, CGPA 8.8) · Rashtra Shakti Vidyalaya, XII 94% / X 95.6%" }
  ],

  // 05 · WRITING — each opens blog.html?note=<index>. Point `href` at another
  // page if a note ever needs its own hand-built layout.
  notes: [
    {
      status: "Field note",
      title: "Making an inference platform model-agnostic",
      summary: "Why the config layer, not the code, should know which model is running.",
      href: "blog.html",
      tags: ["Backend", "Inference", "Model serving"],
      // `body` is what the on-page assistant reads. Write the post here in
      // paragraphs — one string per paragraph — and the assistant can answer from it.
      body: [
        "The third time someone asked for a new detector, I stopped adding branches and started reading the request differently: the platform shouldn't know which model is running. The code path for a segmentation net and a YOLO detector is the same path; only the tensor shapes, the decoder and the labels differ.",
        "So the model contract moved out of the code and into a file that sits next to the weights. It declares the input layout and size, the normalisation, which decoder reads the output tensor, the ordered label list, and the rules that turn detections into alerts. The service resolves it at load time against the inference server's model repository, and re-reads it when the file changes — so adjusting a confidence threshold lands within a frame cycle instead of a deploy.",
        "The thing that took longest to see is that the weights, the shape of the output, and the rules read off that output are one object rather than three. Adding a label changes all three at once. Until they version together, \"roll back the model\" doesn't actually mean anything; once they do, onboarding a new model is a config entry rather than a pull request.",
        "The cost is that config becomes something you have to validate as strictly as code. A bad label map doesn't crash — it mislabels quietly and confidently, which is worse. Schema validation at startup is not optional."
      ]
    },
    {
      status: "Field note",
      title: "Two pipelines, one Compose file",
      summary: "Real-time and batch inference in the same stack, sharing almost nothing but storage.",
      href: "blog.html",
      tags: ["Infrastructure", "Docker", "Observability"],
      body: [
        "The stack runs two independent inference pipelines that happen to share an inference server, object storage and Postgres. One is real-time: camera streams come in over RTSP, frames move between services on ZMQ, and alerts go out sub-second. The other is batch: someone uploads a survey video, a worker claims it minutes later, and writes back an annotated video plus a per-second CSV of what it saw and where.",
        "On a diagram they look like the same pipeline drawn twice. In practice they share almost no properties. The real-time side talks to the inference server over gRPC and holds tracker and dwell state in memory; the batch worker talks to the same server over HTTP and is stateless per job, because the job row in Postgres is the state. Real-time scales by sharding cameras across workers on a hash of the stream key; batch scales by adding workers that claim the next pending job. Trying to make one abstraction cover both was the wrong instinct — keeping them separate and letting them share only the stores is what made either of them tractable.",
        "The first thing to break was never inference. It was startup ordering: the orchestrator would come up before the inference server had finished loading models, mark the backend unhealthy, and give up. Readiness probes that actually ask whether the models are loaded fixed more than any tuning did.",
        "The second was observability paying for itself. Two dozen services in one Compose file is a lot of places for time to disappear, and once every stage emitted metrics the bottleneck turned out to be frame decode rather than the GPU. Skipping frames and downscaling before encode bought more headroom than a bigger card would have."
      ]
    },
    {
      status: "Paper notes",
      title: "The threshold that was wrong by seven times",
      summary: "One inherited number was holding back a whole branch of the model. Recalibrating it doubled its F1.",
      href: "blog.html",
      tags: ["Computer vision", "Research", "Evaluation"],
      body: [
        "Gait-YOLO runs three detectors over the same footage — a weapons detector, an action recogniser, and an autoencoder that scores how unusual someone's walk is — and fuses their outputs. The premise is that real incidents tend to show up in more than one channel, while false alarms are usually a single detector misfiring: a phone read as a pistol, a shoelace tied read as a struggle.",
        "The gait branch was the weak one at F1 0.397, and for a while I assumed the model was the problem. It wasn't. Its anomaly threshold had been inherited from a simulation, and on real CASIA-B sequences the reconstruction errors lived on a completely different scale — the calibrated value came out at 0.0642 against the simulated 0.4521, off by roughly seven times. Same architecture, same weights, same test split, and F1 moved to 0.792.",
        "Nothing about the model changed. A number was wrong, and it was wrong because it had been fitted to data that didn't exist. The lesson I'd keep: calibrate on the distribution you will actually see, and treat any threshold you inherited from a simulation as unmeasured until you've checked it against real inputs.",
        "The rest of the work is fusion discipline. A rule cascade produces an urgency level you can read and audit; a small learned head runs alongside it; and the two are combined so the learned head can only escalate a severity, never relax one — which keeps the cascade as a floor you can reason about. On UCF-Crime the full system reaches recall 1.000 at F1 0.956, staged false-positive analysis takes the weapon-detector baseline FPR from 0.20 to 0.028, and it holds 18–22 FPS on a single T4. The paper was accepted at ICDAM-2026; it's joint work with Rahul and Ketan Anand at DTU."
      ]
    }
  ],

  // 06 · CONTACT
  contact: {
    // Access key from web3forms.com (free, no account needed — they email you
    // a key). With a key the contact form POSTs and delivers on its own; with
    // it blank the form falls back to opening the visitor's mail app, which
    // silently does nothing for anyone who has no mail app set up.
    // Get one at https://web3forms.com — paste it here and you're done.
    formKey: "e8c1b277-83a7-4e30-ab01-7120561395ed",

    // Short status line rendered as a tag above the heading. Keep it current —
    // it's the first thing someone deciding whether to write to you will read.
    availability: "Available for freelance now · Full-time from late 2026",
    heading: "Let's build something that ships",
    body: "Open to full-time software engineering roles from late 2026, and freelance work now. Backend, computer vision, cloud infrastructure — or anything that needs a model turned into a product.",

    // Drafts for the "Talk about work like this" and "Reply by email" buttons.
    // The visitor's mail app opens with this already written, so they are not
    // staring at an empty message — which is most of why people don't send one.
    // {project} and {note} are filled in with whatever page they came from.
    // Written in their voice, not yours. Keep the prompts few; every extra
    // blank line is another thing someone has to answer before they send.
    enquiry: {
      subject: "About your {project} work",
      body: [
        "Hi Himanshu,",
        "",
        "I just read your {project} case study, and I'd like to talk about something similar.",
        "",
        "What we're working on:",
        "",
        "",
        "Best way and time to reach me:",
        "",
        ""
      ].join("\n")
    },
    noteReply: {
      subject: "Re: {note}",
      body: [
        "Hi Himanshu,",
        "",
        "I just read \"{note}\" — ",
        "",
        ""
      ].join("\n")
    }
  }
};
