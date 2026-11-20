# 上下界可行流（Circulation）

有向边 0<=lo<=hi，源点 s 与汇点 t 不同；T 用有符号 64 位类型，流量须小于 1LL<<60。 原点 0..n-1；加完边后，findCirculation 与 findFeasible 二选一且只调用一次。 findFeasible 寻找非负净流基流；成功后才能 maxFlow/minFlow，最小值可为负。

addEdge 返回残量边号；flowOn 用从 0 开始的加边序号；最大/最小流查询均恢复基流，flowOn 不代表极值方案。

O(n^2 m) 时间，O(n+m) 空间。

```cpp
template <class T>
// 上下界可行流网络
struct FlowNetwork {
    // 内部残量边
    struct Edge {
        int u, v;
        T cap; // 残量容量
    };

    int n = 0;          // 原图节点数
    int SS = 0, TT = 0; // 超级源 / 超级汇
    std::vector<Edge> e;
    std::vector<std::vector<int>> g;
    std::vector<int> aux;        // SS/TT 辅助边，判完可行后要整体关掉
    std::vector<int> ori;        // 原边 id，按 addEdge 顺序，flowOn 按它取
    std::vector<T> lo_;          // 每条原边的下界
    std::vector<T> fl_;          // 每条原边**超出下界部分**的流量（flowOn = fl + lo）
    std::vector<int> from_, to_; // 每条原边的端点
    std::vector<int> slot_;      // 边 id -> 原边下标；辅助边为 -1
    int base_ = -1;              // t->s 辅助边在 ori_ 里的下标；-1 表示还没建

    // 创建未初始化对象；使用前调用 init
    FlowNetwork() {}
    // 创建 n 个原点的空网络
    explicit FlowNetwork(int n) {
        init(n);
    }

    // 重置为 n 个原点的空网络
    void init(int n_) {
        n = n_;
        SS = n;
        TT = n + 1;
        e.clear();
        g.assign(n + 2, {});
        aux.clear();
        ori.clear();
        lo_.clear();
        fl_.clear();
        from_.clear();
        to_.clear();
        slot_.clear();
        base_ = -1;
    }

    // 加入不登记的内部边并返回残量边号
    int addRaw(int u, int v, T cap) {
        int id = (int)e.size();
        g[u].push_back(id);
        e.push_back({u, v, cap});
        g[v].push_back(id ^ 1);
        e.push_back({v, u, 0});
        return id;
    }

    // 加入原边 u->v（先上界 hi 后下界 lo），返回残量边号，不能直接传给 flowOn
    int addEdge(int u, int v, T hi, T lo = 0) {
        assert(lo <= hi);
        int id = addRaw(u, v, hi - lo);
        ori.push_back(id);
        lo_.push_back(lo);
        fl_.push_back(0);
        from_.push_back(u);
        to_.push_back(v);
        slot_.resize(id + 2, -1);
        slot_[id] = (int)ori.size() - 1;
        slot_[id ^ 1] = (int)ori.size() - 1;
        return id;
    }

    // 按从 0 开始的加边序号返回原边当前流量（含下界），参数不是残量边号
    T flowOn(int idx) const {
        assert(idx >= 0 && idx < (int)ori.size());
        return fl_[idx] + lo_[idx];
    }

    // 作废一条残量边但保留流量计数
    void disable(int id) {
        e[id].cap = 0;
        e[id ^ 1].cap = 0;
    }

    // 返回各点入下界减出下界的不平衡量
    std::vector<i64> balOf() const {
        std::vector<i64> bal(n + 2, 0);
        for (size_t k = 0; k < ori.size(); k++) {
            if (k == base_)
                continue;
            i64 lo = (i64)lo_[k];
            bal[from_[k]] -= lo;
            bal[to_[k]] += lo;
        }
        return bal;
    }

    // 求指定源汇的 Dinic 最大流
    T dinic(int s, int t) {
        std::vector<int> lvl(n + 2), cur(n + 2);
        std::queue<int> q;
        T ans = 0;
        while (true) {
            std::fill(lvl.begin(), lvl.end(), -1);
            lvl[s] = 0;
            q.push(s);
            while (!q.empty()) {
                int u = q.front();
                q.pop();
                for (int i : g[u]) {
                    if (e[i].cap > 0 && lvl[e[i].v] == -1) {
                        lvl[e[i].v] = lvl[u] + 1;
                        q.push(e[i].v);
                    }
                }
            }
            if (lvl[t] == -1)
                break;
            std::fill(cur.begin(), cur.end(), 0);
            auto dfs = [&](int u, T f) -> T {
                struct Frame {
                    int vertex;
                    T limit, sent;
                    int incoming;
                };
                std::vector<Frame> frames{{u, f, T(0), -1}};
                while (!frames.empty()) {
                    auto &frame = frames.back();
                    int vertex = frame.vertex;
                    if (vertex == t || frame.sent == frame.limit ||
                        cur[vertex] == int(g[vertex].size())) {
                        T amount = vertex == t ? frame.limit : frame.sent;
                        int incoming = frame.incoming;
                        frames.pop_back();
                        if (frames.empty())
                            return amount;
                        auto &parent = frames.back();
                        parent.sent += amount;
                        e[incoming].cap -= amount;
                        e[incoming ^ 1].cap += amount;
                        int slot = incoming < int(slot_.size()) ? slot_[incoming] : -1;
                        if (slot >= 0)
                            fl_[slot] += (incoming & 1) ? -amount : amount;
                        if (parent.sent < parent.limit)
                            ++cur[parent.vertex];
                        continue;
                    }
                    int edge = g[vertex][cur[vertex]];
                    int next = e[edge].v;
                    if (e[edge].cap <= 0 || lvl[next] != lvl[vertex] + 1) {
                        ++cur[vertex];
                        continue;
                    }
                    T limit = std::min(frame.limit - frame.sent, e[edge].cap);
                    frames.push_back({next, limit, T(0), edge});
                }
                return T(0);
            };
            T f;
            while ((f = dfs(s, std::numeric_limits<T>::max())) > 0)
                ans += f;
        }
        return ans;
    }

    // 加完原边后判断无源汇可行环流；与 findFeasible 二选一，只调用一次
    bool findCirculation() {
        T want = 0;
        auto bal = balOf();
        for (int i = 0; i < n; i++) {
            if (bal[i] > 0) {
                aux.push_back(addRaw(SS, i, (T)bal[i]));
                want += (T)bal[i];
            } else if (bal[i] < 0) {
                aux.push_back(addRaw(i, TT, (T)(-bal[i])));
            }
        }
        return dinic(SS, TT) == want;
    }

    // 可行基流的净流量
    i64 baseFlow = 0;

    // 加完原边后寻找非负净流的可行 s-t 基流；只调用一次，成功后才可查询极值
    bool findFeasible(int s, int t) {
        assert(s != t);
        T want = 0;
        auto bal = balOf();
        for (int i = 0; i < n; i++) {
            if (bal[i] > 0) {
                aux.push_back(addRaw(SS, i, (T)bal[i]));
                want += (T)bal[i];
            } else if (bal[i] < 0) {
                aux.push_back(addRaw(i, TT, (T)(-bal[i])));
            }
        }
        int tsId = addEdge(t, s, (T)1 << 60, 0);
        base_ = (int)ori.size() - 1;
        if (dinic(SS, TT) != want)
            return false;
        baseFlow = (i64)e[tsId ^ 1].cap;
        for (int id : aux)
            disable(id);
        aux.clear();
        disable(tsId);
        return true;
    }

    // 残量容量与流量计数快照
    struct Snap {
        std::vector<T> cap, fl;
    };
    // 保存当前残量与流量
    Snap snapshot() const {
        Snap s;
        s.cap.resize(e.size());
        for (size_t i = 0; i < e.size(); i++)
            s.cap[i] = e[i].cap;
        s.fl = fl_;
        return s;
    }
    // 恢复同一边结构的快照
    void restore(const Snap &snap) {
        assert(snap.cap.size() == e.size() && snap.fl.size() == fl_.size());
        for (size_t i = 0; i < e.size(); i++)
            e[i].cap = snap.cap[i];
        fl_ = snap.fl;
    }

    // findFeasible 成功后返回最大净流；查询后恢复基流，不保留极值边流量
    T maxFlow(int s, int t) {
        auto snap = snapshot();
        T r = (T)baseFlow + dinic(s, t);
        restore(snap);
        return r;
    }

    // findFeasible 成功后返回最小净流，可为负；查询后恢复基流
    T minFlow(int s, int t) {
        auto snap = snapshot();
        T r = (T)baseFlow - dinic(t, s);
        restore(snap);
        return r;
    }
};
```
